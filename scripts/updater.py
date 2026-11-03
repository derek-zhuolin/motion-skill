"""Explicit stable-release maintenance. Python standard library; no agent/model calls."""
import argparse
import contextlib
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import sys
import tempfile
import time
import urllib.request
import uuid
import zipfile

SKILL = Path(__file__).resolve().parents[1]
MAX_BYTES = 100 * 1024 * 1024
MANAGED = '.motion-install.json'


def read(path):
    return json.loads(Path(path).read_text())


def write(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.tmp-' + uuid.uuid4().hex)
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    os.replace(temp, path)


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def inventory(root):
    out = {}
    for p in sorted(Path(root).rglob('*')):
        if p.is_symlink():
            raise ValueError('Skill must not contain symlinks: ' + str(p))
        if p.is_file() and p.name != MANAGED and '__pycache__' not in p.parts and not p.name.endswith('.pyc'):
            out[p.relative_to(root).as_posix()] = digest(p)
    return out


def semver(value):
    match = re.fullmatch(r'v?(\d+)\.(\d+)\.(\d+)', str(value))
    if not match:
        raise ValueError('Stable version must be X.Y.Z')
    return tuple(map(int, match.groups()))


def state_dir(target):
    return target.parent / ('.' + target.name + '-state')


@contextlib.contextmanager
def locked(target):
    lock = target.parent / ('.' + target.name + '-update.lock')
    try:
        lock.mkdir()
    except FileExistsError:
        raise ValueError('Another update is in progress; inspect ' + str(lock))
    try:
        yield
    finally:
        lock.rmdir()


def validate_manifest(manifest):
    semver(manifest['version'])
    if manifest.get('skill') != 'motion-video' or not isinstance(manifest.get('files'), dict) or not manifest['files']:
        raise ValueError('Invalid Motion Skill manifest')
    for name, sha in manifest['files'].items():
        parts = PurePosixPath(name)
        if parts.is_absolute() or '..' in parts.parts or '\\' in name or ':' in name or str(parts) != name or name == MANAGED:
            raise ValueError('Unsafe manifest path')
        if not re.fullmatch('[a-f0-9]{64}', sha):
            raise ValueError('Invalid file checksum')
    if not re.fullmatch('[a-f0-9]{64}', manifest.get('sha256', '')):
        raise ValueError('Missing archive checksum')
    if sys.version_info[:2] < tuple(manifest.get('minimum_python', [3, 9])):
        raise ValueError('Python version is incompatible; keep existing installation')


def extract_checked(archive, manifest, destination):
    validate_manifest(manifest)
    if digest(archive) != manifest['sha256']:
        raise ValueError('Archive SHA-256 mismatch')
    total, seen = 0, set()
    with zipfile.ZipFile(archive) as z:
        if len(z.infolist()) > 2000:
            raise ValueError('Too many archive entries')
        for info in z.infolist():
            path = PurePosixPath(info.filename)
            total += info.file_size
            mode = info.external_attr >> 16
            if (path.is_absolute() or '..' in path.parts or '\\' in info.filename or ':' in info.filename
                or not path.parts or path.parts[0] != 'motion-video' or stat.S_ISLNK(mode)
                or total > MAX_BYTES or info.filename in seen or str(path) != info.filename.rstrip('/')):
                raise ValueError('Unsafe archive entry')
            seen.add(info.filename)
            if info.is_dir():
                continue
            relative = PurePosixPath(*path.parts[1:]).as_posix()
            if relative not in manifest['files']:
                raise ValueError('Unlisted archive file: ' + relative)
            out = destination / relative
            out.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as src, out.open('wb') as dst:
                shutil.copyfileobj(src, dst)
            out.chmod(0o755 if mode & 0o111 else 0o644)
    if inventory(destination) != manifest['files']:
        raise ValueError('Extracted file manifest mismatch')
    metadata = read(destination/'references/provenance.json')
    if metadata['version'] != manifest['version']:
        raise ValueError('Version mismatch inside archive')
    for name in ('SKILL.md', 'scripts/motion.py', 'scripts/updater.py'):
        if not (destination/name).is_file():
            raise ValueError('Incomplete installation: ' + name)
    # Compile without importing/executing downloaded code or creating pycache.
    for p in destination.rglob('*.py'):
        compile(p.read_text(), str(p), 'exec')


def local_changes(target):
    info = read(target/MANAGED)
    now = inventory(target)
    baseline = info['files']
    return sorted(k for k in set(now) | set(baseline) if now.get(k) != baseline.get(k))


def apply_release(target, archive, manifest, repository=None, migrate=False, install=False):
    target = Path(target).expanduser().absolute()
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_symlink():
        raise ValueError('Refusing symlink installation target')
    validate_manifest(manifest)
    with locked(target):
        if target.exists():
            if not (target/MANAGED).is_file():
                if not migrate:
                    raise ValueError('Unmanaged directory: explicit --migrate required; existing files remain untouched')
            else:
                info = read(target/MANAGED)
                if info.get('repository') != repository:
                    raise ValueError('Source repository changed; refusing update')
                changes = local_changes(target)
                if changes:
                    raise ValueError('Local changes need manual review: ' + ', '.join(changes[:12]))
                if semver(manifest['version']) <= semver(info['version']):
                    return {'status': 'up_to_date', 'version': info['version'], 'target': str(target)}
        elif not install:
            raise ValueError('Target is not installed; use install first')
        state = state_dir(target)
        state.mkdir(exist_ok=True)
        receipt_path = state/'receipt.json'
        previous_receipt = read(receipt_path) if receipt_path.exists() else None
        backup_files = inventory(target) if target.exists() else None
        backup = state/('backup-' + uuid.uuid4().hex)
        with tempfile.TemporaryDirectory(prefix='stage-', dir=state) as tmp:
            staged = Path(tmp)/'motion-video'
            staged.mkdir()
            extract_checked(archive, manifest, staged)
            write(staged/MANAGED, {'version': manifest['version'], 'files': manifest['files'],
                'repository': repository, 'archive_sha256': manifest['sha256'], 'installed_at': time.time()})
            moved = False
            try:
                if target.exists():
                    target.rename(backup)
                    moved = True
                staged.rename(target)
                if inventory(target) != manifest['files']:
                    raise ValueError('Installed files failed checksum self-check')
                receipt = {'status': 'updated' if moved else 'installed', 'version': manifest['version'],
                    'target': str(target), 'backup': str(backup) if moved else None,
                    'sha256': manifest['sha256'], 'previous_receipt': previous_receipt, 'backup_files': backup_files,
                    'checked_at': time.time(), 'network_or_model_generation': False}
                write(receipt_path, receipt)
            except Exception:
                if target.exists():
                    shutil.rmtree(target)
                if moved:
                    backup.rename(target)
                if previous_receipt:
                    write(receipt_path, previous_receipt)
                raise
        return receipt


def rollback(target):
    target = Path(target).expanduser().absolute()
    if target.is_symlink():
        raise ValueError('Refusing symlink target')
    with locked(target):
        receipt_path = state_dir(target)/'receipt.json'
        receipt = read(receipt_path)
        backup = Path(receipt.get('backup') or '')
        if backup.parent != state_dir(target) or not backup.is_dir():
            raise ValueError('No previous backup available')
        if inventory(backup) != receipt.get('backup_files'):
            raise ValueError('Backup was modified; refusing rollback')
        if not (target/MANAGED).is_file() or local_changes(target):
            raise ValueError('Current installation has local changes; refusing to discard them')
        newer = state_dir(target)/('rolled-back-' + uuid.uuid4().hex)
        target.rename(newer)
        try:
            backup.rename(target)
            write(receipt_path, receipt.get('previous_receipt') or {'status': 'restored_unmanaged', 'backup': None})
        except Exception:
            if target.exists():
                target.rename(backup)
            newer.rename(target)
            raise
        return {'status': 'rolled_back', 'target': str(target), 'retained_newer_copy': str(newer)}


def request_bytes(url, limit=MAX_BYTES):
    req = urllib.request.Request(url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'motion-video-updater/1.1'})
    with urllib.request.urlopen(req, timeout=6) as response:
        final = response.geturl()
        from urllib.parse import urlparse
        host = urlparse(final).hostname or ''
        if urlparse(final).scheme != 'https' or not (host == 'github.com' or host == 'api.github.com' or host.endswith('.githubusercontent.com')):
            raise ValueError('Unexpected download host')
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError('Download exceeds size limit')
        return data


def latest(repository):
    if not repository or not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise ValueError('GitHub repository is not configured; pass --repo OWNER/REPO')
    release = json.loads(request_bytes('https://api.github.com/repos/' + repository + '/releases/latest', 2 * 1024 * 1024))
    if release.get('draft') or release.get('prerelease'):
        raise ValueError('Expected a published stable release')
    semver(release['tag_name'])
    assets = {a['name']: a['browser_download_url'] for a in release.get('assets', [])}
    manifest_url = assets.get('motion-video.manifest.json')
    prefix = 'https://github.com/' + repository + '/releases/download/' + release['tag_name'] + '/'
    if not manifest_url or not manifest_url.startswith(prefix):
        raise ValueError('Stable release has no trusted Motion manifest')
    manifest = json.loads(request_bytes(manifest_url, 2 * 1024 * 1024))
    validate_manifest(manifest)
    if semver(manifest['version']) != semver(release['tag_name']):
        raise ValueError('Release tag and manifest disagree')
    archive_url = assets.get(manifest['archive'])
    if not archive_url or not archive_url.startswith(prefix):
        raise ValueError('Release archive missing or outside repository')
    return release, manifest, archive_url


def repository_for(target, override=None):
    if override:
        return override
    marker = target/MANAGED
    if marker.exists():
        return read(marker).get('repository')
    return read(target/'references/update-source.json').get('repository')


def maybe_notice(target):
    """Opt-in, once/day; no call or filesystem write when disabled."""
    target = Path(target)
    settings = state_dir(target)/'preferences.json'
    if not settings.exists() or not read(settings).get('enabled'):
        return None
    cache_path = state_dir(target)/'notice-cache.json'
    cache = read(cache_path) if cache_path.exists() else {}
    if time.time() - cache.get('checked_at', 0) < 86400:
        return cache.get('notice')
    try:
        repo = repository_for(target)
        release, manifest, _ = latest(repo)
        version = read(target/'references/provenance.json')['version']
        notice = {'version': manifest['version'], 'current': version, 'url': release['html_url'],
            'message': 'Motion Skill 有新版；运行 motion.py update。现有工程不变。'} if semver(manifest['version']) > semver(version) else None
    except Exception as error:
        notice = {'status': 'check_unavailable', 'message': str(error), 'production_blocked': False}
    write(cache_path, {'checked_at': time.time(), 'notice': notice})
    return notice


def cli(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('action', choices=['install', 'update', 'rollback', 'updates'])
    p.add_argument('--target', type=Path, default=SKILL)
    p.add_argument('--repo')
    p.add_argument('--check', action='store_true')
    p.add_argument('--manifest', type=Path, help='Explicit local candidate manifest for isolated acceptance')
    p.add_argument('--archive', type=Path)
    p.add_argument('--migrate', action='store_true', help='Explicitly back up and adopt an unmanaged installation')
    p.add_argument('--enable', action=argparse.BooleanOptionalAction, default=None)
    args = p.parse_args(argv)
    try:
        target = args.target.expanduser().absolute()
        if args.action == 'updates':
            settings = state_dir(target)/'preferences.json'
            if args.enable is not None:
                write(settings, {'enabled': args.enable})
            result = read(settings) if settings.exists() else {'enabled': False}
        elif args.action == 'rollback':
            result = rollback(target)
        else:
            repo = repository_for(target, args.repo) if target.exists() else args.repo
            if args.manifest:
                manifest = read(args.manifest)
                validate_manifest(manifest)
                archive = args.archive or args.manifest.parent/manifest['archive']
                release = {'html_url': None, 'body': 'Local candidate; not published'}
            else:
                release, manifest, url = latest(repo)
                archive = None
            if args.check:
                current = read(target/'references/provenance.json')['version'] if target.exists() else None
                result = {'status': 'update_available' if not current or semver(manifest['version']) > semver(current) else 'up_to_date',
                    'current': current, 'latest': manifest['version'], 'url': release['html_url'], 'notes': release['body']}
            else:
                with tempfile.TemporaryDirectory(prefix='motion-download-') as tmp:
                    if archive is None:
                        archive = Path(tmp)/'motion-video.zip'
                        archive.write_bytes(request_bytes(url))
                    result = apply_release(target, archive, manifest, repo, args.migrate, args.action == 'install')
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as error:
        print(json.dumps({'status': 'blocked', 'error': str(error)}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(1)
