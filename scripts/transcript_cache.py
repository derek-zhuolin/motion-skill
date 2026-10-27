"""Content-addressed local transcript lookup. No ASR, model, or network execution."""
import argparse,json,hashlib,time
from pathlib import Path

def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def run(args):
 media=Path(args.media).expanduser().resolve();key=sha(media);root=Path(args.cache).expanduser().resolve()/key
 if args.command=='get':
  matches=[]
  for p in sorted(root.glob('*.entry.json')) if root.exists() else []:
   e=json.loads(p.read_text());t=Path(e['transcript'])
   if e['media_sha256']==key and t.is_file() and sha(t)==e['transcript_sha256']:matches.append(e)
  return {'media_sha256':key,'hit':bool(matches),'candidates':matches,'human_verification':'not inferred; inspect coverage, word times and terms before reuse'}
 t=Path(args.transcript).expanduser().resolve();json.loads(t.read_text());th=sha(t);root.mkdir(parents=True,exist_ok=True)
 out=root/(th+'.entry.json')
 record={'media_sha256':key,'transcript':str(t),'transcript_sha256':th,'engine':args.engine,'recorded_at':time.time(),'verified':False}
 if out.exists():return {'registered':False,'reason':'already recorded','entry':str(out)}
 out.write_text(json.dumps(record,ensure_ascii=False,indent=2));return {'registered':True,'entry':str(out),'verified':False}
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['get','put']);p.add_argument('--media',required=True);p.add_argument('--cache',default=str(Path(__file__).resolve().parents[1]/'.local/transcript-cache'));p.add_argument('--transcript');p.add_argument('--engine')
 a=p.parse_args()
 if a.command=='put' and (not a.transcript or not a.engine):p.error('put needs --transcript and --engine')
 print(json.dumps(run(a),ensure_ascii=False,indent=2))
