"use strict";
let _threeInstances = null;

var loader; //Three Loader 看依載入的類型
var models; //載入的模型

const clock = new THREE.Clock();
var time, startTime, prevTime;

var mixer;
var animationClips;

var events = {};

var that = this;
var scene;
var camera;
var renderer;

var stats;

var webcamDeviceIndex = 0;

//攝影機設定
var videoSettings= {
  // 'videoElement'           // not set by default. <video> element used
  'deviceId' :'',             // not set by default
  'facingMode': 'face',       // to use the rear camera, set to 'environment' //face前鏡頭,environment後鏡頭
  'idealWidth': 800,          // ideal video width in pixels
  'idealHeight': 600,         // ideal video height in pixels
  'minWidth': 480,            // min video width in pixels
  'maxWidth': 1920,           // max video width in pixels
  'minHeight': 480,           // min video height in pixels
  'maxHeight': 1920,          // max video height in pixels,
  'rotate': 0,                // rotation in degrees possible values: 0,90,-90,180
  'flipX': false              // if we should flip horizontally the video. Default: false
}


var scenemodelFile = 'scene_0001_VDay01.json';

//stat
function initStats(){  
    var stats = new Stats();  
    //setMode參數如果是0，監控是FPS，如果是1，監控是渲染時間
    stats.setMode(0);  
    //把統計開左上角
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.left = '0px';
    document.body.appendChild(stats.domElement);
    return stats;
}

function start() {
  stats = initStats();  
  // get the 2 canvas from the DOM:
  const canvasFace  = document.getElementById("WebARRocksFaceCanvas");
  const canvasThree = document.getElementById("threeCanvas");

  //取得VideoDevices
  WEBARROCKSFACE.get_videoDevices
  (function(vd)
    {
      videoSettings.deviceId = vd[webcamDeviceIndex].deviceId;
    }
  );

  WebARRocksFaceThreeHelper.init({
    spec: {
      NNCPath: "../neuralNets/NN_FACE_0.json",
      maxFacesDetected  : 1,
      videoSettings : videoSettings,
      onWebcamAsk : OnWebcamAsk,
      onWebcamGet : OnWebcamGet
    },

    canvas: canvasFace,
    canvasThree: canvasThree,
   

    //update() : detectState 偵測資訊 有無偵測 LandMark位置(2D的) 
    callbackTrack: function (detectState) {
      // console.log(detectState);
    },

    callbackReady: function (err, threeInstances) {
      if (err) {
        console.log("ERROR in main.js: ", err);
        return;
      }

      WebARRocksFaceThreeHelper.resize(window.innerWidth, window.innerHeight);

      // threeInstances are the THREE.js instances initialized by the helper
      // There are a THREE.Camera, a THREE.Scene and an object following the face
      build_scene(threeInstances);
    },
  }); //end WebARRocksFaceThreeHelper.init()
} //end of  start

function OnWebcamAsk()
{
  console.log('[On Webcam Ask]');
}

function OnWebcamGet()
{
  console.log('[On Webcam Get]');
}

function build_scene(threeInstances) {

    _threeInstances = threeInstances;
    renderer 	      = _threeInstances.threeRenderer;
    scene 		      = _threeInstances.threeScene;
    camera 		      = _threeInstances.threeCamera;

    _threeInstances.threeFaceFollowers[0].scale.x =-1.0;
    _threeInstances.threeFaceFollowers[0].scale.y =1.0;
    _threeInstances.threeFaceFollowers[0].scale.z =1.0;

    const threeLoadingManager = new THREE.LoadingManager();

    // loadSceneFromGLB();      //載入GLB
    loadSceneFromJson(scenemodelFile);        //載入Json Scene


    //occluder遮擋，另外在loadSceneFromJson有檢查userData.isOccluder，故先註解
    // var occluderOBJ= WebARRocksFaceThreeHelper.add_occluderFromFile(
    // 'assets/occluder.glb',
    // function (occluder) {
    //   occluder.scale.multiplyScalar(2.0); //occluder大小
    // },
    // threeLoadingManager,
    // false       //是否顯示模型
    // );


    // add tone mapping:
    _threeInstances.threeRenderer.outputEncoding = THREE.sRGBEncoding;
    _threeInstances.threeRenderer.toneMapping = THREE.NoToneMapping;

    //Note: webRock很多都會用到LoadingManager作定位或是新增物件,先預留著
    threeLoadingManager.onLoad = function ( ) {console.log( 'Loading complete!');};
}

//載入場景From Json 
function loadSceneFromJson(sceneName)
{
  //require Jquery
  $.getJSON(sceneName, function (json) {

      loader = new THREE.ObjectLoader();

      loader.parse(json.scene,
        function(obj)
        {
          mixer = new THREE.AnimationMixer( _threeInstances.threeScene );
          animationClips =[];

          models = obj;
          if(obj.environment != null)
          {
            _threeInstances.threeScene.environment = obj.environment;
          }

          _threeInstances.threeFaceFollowers[0].add(obj);

          
          _threeInstances.threeFaceFollowers[0].traverse((item) => 
          {
            //把燈光拉到場景外，避免模型沒有燈光反射的效果
            if(item.isLight)
            {
              item.parent = scene;
            }

            //setOccluder
            if(item.isMesh && item.userData.isOccluder==true){
              let mat = new THREE.ShaderMaterial({
                vertexShader: THREE.ShaderLib.basic.vertexShader,
                fragmentShader: "precision lowp float;\n void main(void){\n gl_FragColor = vec4(1.,0.,0.,1.);\n }",
                uniforms: THREE.ShaderLib.basic.uniforms,
                side: THREE.DoubleSide,
                colorWrite: false
                });
                item.renderOrder = -1e12; // render first
                item.material = mat;
            }

            //animation
            if(item.animations.length!=0)
            {
              for(var i = 0 ; i<item.animations.length;i++)
              {
                animationClips.push(item.animations[i]);
              }
            }
          });


          if(animationClips.length!=0)
          {
            for(var i = 0 ; i<animationClips.length;i++)
            {
              // mixer.clipAction( animationClips[i]).loop = THREE.LoopPingPong;
              var action = mixer.clipAction(animationClips[i]);
              action.reset();
              action.timeScale = 1;
              action.setLoop(THREE.LoopPingPong);
              action.clampWhenFinished = true;
              action.play();
            }
          }

          _threeInstances.threeRenderer.setAnimationLoop( animate );
          
          SetScriptFromJson(json);
        });

  });

}

function SetScriptFromJson(value)
{
  startTime = prevTime = performance.now();

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );
  document.addEventListener( 'pointerdown', onPointerDown );
  document.addEventListener( 'pointerup', onPointerUp );
  document.addEventListener( 'pointermove', onPointerMove );

  events = {
    init: [],
    start: [],
    stop: [],
    keydown: [],
    keyup: [],
    pointerdown: [],
    pointerup: [],
    pointermove: [],
    update: []
  };

  var scriptWrapParams = 'player,renderer,scene,camera,mixer';
  var scriptWrapResultObj = {};

  for ( var eventKey in events ) {

    scriptWrapParams += ',' + eventKey;
    scriptWrapResultObj[ eventKey ] = eventKey;

  }

  var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

  for ( var uuid in value.scripts ) {

    var object = scene.getObjectByProperty( 'uuid', uuid, true );

    if ( object === undefined ) {

      console.warn( 'APP.Player: Script without object.', uuid );
      continue;

    }
    
    var scripts = value.scripts[ uuid ];

    for ( var i = 0; i < scripts.length; i ++ ) {

      var script = scripts[ i ];

      var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( that, renderer, scene, camera,mixer );
      
      for ( var name in functions ) {

        if ( functions[ name ] === undefined ) continue;

        if ( events[ name ] === undefined ) {

          console.warn( 'APP.Player: Event type not supported (', name, ')' );
          continue;

        }

        events[ name ].push( functions[ name ].bind( object ) );

      }

    }

  }

  dispatch( events.init, arguments );
}

//載入GLB
function loadSceneFromGLB()
{
  loader = new THREE.GLTFLoader();

  loader.load('./assets/3D_0090_fatday_hat.glb',
    function ( gltf ) {
      models = gltf.scene;
      gltf.scene.scale.set(1500,1500,1500);
      gltf.scene.position.set(0,100,-120);
      _threeInstances.threeFaceFollowers[0].add(gltf.scene);
    },
    // called while loading is progressing
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
  
      console.log( 'An error happened' );
  
    }
  );
    //add lighting:如果直接讀GLB 要另外補加燈光
    const pointLight = new THREE.DirectionalLight(new THREE.Color("rgb(203,251,255)"), 1.5);
    pointLight.position.set(5,10,7.5);
    _threeInstances.threeScene.add(pointLight);
    const ambientLight = new THREE.AmbientLight(new THREE.Color("rgb(203,251,255)"), 0.5);
    _threeInstances.threeScene.add(ambientLight);
}

function animate()
{
  time = performance.now();
			
  try {

    dispatch( events.update, { time: time - startTime, delta: time - prevTime } );

  } catch ( e ) {

    console.error( ( e.message || e ), ( e.stack || '' ) );

  }

  renderer.render(_threeInstances.threeScene, _threeInstances.threeCamera );

  const delta = clock.getDelta();
  if(mixer!=null)
  {
    
    mixer.update(delta); // 速率
  }

  if(stats!=null)
    stats.update();
}

function main() {
  WebARRocksResizer.size_canvas({
    canvasId: "WebARRocksFaceCanvas",
    callback: start,
  });
}




//event
function onKeyDown( event ) {

  dispatch( events.keydown, event );

}

function onKeyUp( event ) {

  dispatch( events.keyup, event );

}

function onPointerDown( event ) {

  dispatch( events.pointerdown, event );

}

function onPointerUp( event ) {

  dispatch( events.pointerup, event );

}

function onPointerMove( event ) {

  dispatch( events.pointermove, event );

}

function dispatch( array, event ) {

  for ( var i = 0, l = array.length; i < l; i ++ ) {

    array[ i ]( event );

  }

}



//switch webcam
function switchDevice()
{
  var devices=[];
  WEBARROCKSFACE.get_videoDevices(
    function(vd)
    {
      devices = vd;

      if(devices==null)
      {
        stopDevice();
        return;
      }

      if(devices.length==0)
      {
        stopDevice();
        return;
      }

      webcamDeviceIndex++;
      if(webcamDeviceIndex>=devices.length)
      {
        webcamDeviceIndex = 0;
      }

      videoSettings.deviceId = devices[webcamDeviceIndex].deviceId;
      WEBARROCKSFACE.update_videoSettings(videoSettings);
      console.log("Device ID : ",webcamDeviceIndex," ",devices[webcamDeviceIndex]);
    }
  );
}

function stopDevice()
{
  WEBARROCKSFACE.update_videoSettings(null);
  console.log("devices is null");
}



//for test
//Input test
document.addEventListener('keyup', function(event) {
  if (event.keyCode == 37) {
      switchDevice();
  }
}, true);

document.addEventListener('touchstart', function(event) {
  switchDevice();
}, false);