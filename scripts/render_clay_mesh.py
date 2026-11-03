"""Run in a separate Blender background process, never in the user's open scene.

Produces a bounded procedural layered assembly and projected label anchors.
This is one spatial recipe, not general 3D generation.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from explainer import spatial_assembly


def material(name, color):
    value=bpy.data.materials.new(name);value.use_nodes=True
    shader=value.node_tree.nodes.get('Principled BSDF')
    def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
    rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)]
    shader.inputs['Base Color'].default_value=(*[linear(v) for v in rgb],1)
    shader.inputs['Roughness'].default_value=.64
    return value


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--brief',required=True)
    parser.add_argument('--dest',required=True)
    parser.add_argument('--frames',type=int,default=64)
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    brief=json.loads(Path(args.brief).read_text())
    parts=spatial_assembly(brief)['segments']
    if not 2<=len(parts)<=4 or not 2<=args.frames<=120:raise ValueError('Use 2–4 layers and 2–120 frames')
    dest=Path(args.dest).resolve();dest.mkdir(parents=True,exist_ok=False)
    (dest/'input-brief.json').write_text(json.dumps(brief,ensure_ascii=False,indent=2))
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=800;scene.render.resolution_y=590;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.render.film_transparent=True
    scene.world.use_nodes=True
    scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.76,.83,1,1)
    scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.55
    scene.view_settings.view_transform='AgX'
    palettes=['#2055C9','#F3F7FC','#C9F176','#8DB2EF']
    meshes=[]
    for i,part in enumerate(parts):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0))
        obj=bpy.context.object;obj.name=part['id']
        obj.dimensions=(3.2 if i!=1 else 2.75,2.25 if i!=1 else 1.85,.45 if i!=len(parts)-1 else .30)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        bevel=obj.modifiers.new('soft clay edges','BEVEL');bevel.width=.18;bevel.segments=7
        normal=obj.modifiers.new('weighted surface normals','WEIGHTED_NORMAL')
        obj.data.materials.append(material(part['id'],palettes[i]))
        for poly in obj.data.polygons:poly.use_smooth=True
        meshes.append(obj)
    for name,location,power,size in [('key',(-4,-5,7),750,5),('fill',(5,-1,4),500,4),('rim',(0,5,6),850,3)]:
        bpy.ops.object.light_add(type='AREA',location=location)
        light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size
        light.rotation_euler=(Vector((0,0,.5))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(5,-8,5))
    camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=7.2;scene.camera=camera
    frames=[]
    for f in range(args.frames):
        p=f/(args.frames-1);ease=p*p*(3-2*p)
        angle=math.radians(-22+55*ease)
        camera.location=(8*math.sin(angle),-8*math.cos(angle),4.7)
        camera.rotation_euler=(Vector((0,0,.45))-camera.location).to_track_quat('-Z','Y').to_euler()
        spread=max(0,min(1,(p-.22)/.58));spread=spread*spread*(3-2*spread)
        for i,obj in enumerate(meshes):
            obj.location=(0,0,(i-(len(meshes)-1)/2)*(.48+spread*.88)+.45)
        bpy.context.view_layer.update()
        filename=f'{f:04d}.png'
        scene.render.filepath=str(dest/filename)
        bpy.ops.render.render(write_still=True)
        anchors=[]
        for obj in meshes:
            coord=world_to_camera_view(scene,camera,obj.location)
            anchors.append({'id':obj.name,'x':coord.x,'y':1-coord.y,'visible':coord.z>0})
        frames.append({'file':filename,'parts':anchors,'sha256':hashlib.sha256((dest/filename).read_bytes()).hexdigest()})
        print(f'MOTION_MESH_FRAME {f+1}/{args.frames}',flush=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(dest/'assembly.blend'))
    manifest={'representation':'rendered-mesh-3d','width':800,'height':590,'frames':frames,
              'geometry':'procedural beveled mesh layers; actual depth, normals, occlusion and camera orbit',
              'engine':scene.render.engine,'blender_version':bpy.app.version_string,'part_ids':[p['id'] for p in parts],
              'scene_file':'assembly.blend','source_sha256':hashlib.sha256(Path(args.brief).read_bytes()).hexdigest()}
    (dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
