"use strict";
let _threeInstances = null;

var loader; //Three Loader 看依載入的類型
var models; //載入的模型

const clock = new THREE.Clock();
var time, startTime, prevTime;

// var mixer; //暫沒用到

var events = {};

var that = this;
var scene;
var camera;
var renderer;

var stats;

var webcamDeviceIndex = 0;

var scenemodelFile = 'scene_event_funkARrelease.json';

var nowStatus = 0;

var animationList = {};
var animMixer=[];

/*
0: picbot出場動畫
1: 偵測臉部狀態，播放掃描動畫
2: 偵測完成，播放眼鏡動畫
3: 播放zoom in 動畫
4: 出現連結按鈕


//備註流程用 : 
1.picbot模型顯示
2.開啟臉部提示，等待掃臉
3.偵測到臉兩秒後播動畫
4.播放掃臉動畫,開啟facemesh
5.關閉facemesh,播放眼鏡動畫
6.出現淡出plane，播放sprite,畫面變白
7.出現連結按鈕
*/


//各項object

var nonTrackItem;       //不被追蹤的物件,picbot，掃臉特效
var AniDatas = [];      //場景上的所有動畫
var helmetObjs = [];      //頭戴的物件，如果沒偵測到臉則關閉
var facemesh;           //facemesh
var text_Face_scanning; //文字掃描
var tex_VIP_intro;      //文字掃描
var fadeOutPanel;       //淡出按鈕

var isDetect = false;
var detectCounter = 0.0;
var detectDelayCounter = 0.0;


var img_VIP = new THREE.TextureLoader().load( 'images/frame_VIP.png' );
var img_granted = new THREE.TextureLoader().load( 'images/frame_access.png' );
var img_scan = new THREE.TextureLoader().load( 'images/frame_SCAN.png' );

function AddAnimations(item)
{
  
  // let animations = item.animations;
  // animMixer[item.name] = new THREE.AnimationMixer(_threeInstances.threeScene);

  // animations.forEach(animclip => {
  //     animationList[animclip.name] = this.animMixer[item.name].clipAction(animclip);
  // });

  var mixer = new THREE.AnimationMixer(item);


  var clipAction = mixer.clipAction(item.animations[0]);

  var aniData = {
    'index' :item.userData.Animation,
    'object' :item,
    'clip':item.animations[0],
    'timeScale':item.userData.timeScale,
    'clipAction':clipAction,
    'mixer':mixer
  }
  item.visible = false;

  animMixer.push(mixer);
  AniDatas.push(aniData);

}

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
}

//stat
// function initStats(){  
//     var stats = new Stats();  
//     //setMode參數如果是0，監控是FPS，如果是1，監控是渲染時間
//     stats.setMode(0);  
//     //把統計開左上角
//     stats.domElement.style.position = 'absolute';
//     stats.domElement.style.top = '0px';
//     stats.domElement.style.left = '0px';
//     document.body.appendChild(stats.domElement);
//     return stats;
// }

function start() {
  // stats = initStats();  
  // get the 2 canvas from the DOM:
  const canvasFace  = document.getElementById("WebARRocksFaceCanvas");
  const canvasThree = document.getElementById("threeCanvas");

  //取得VideoDevices
  // WEBARROCKSFACE.get_videoDevices
  // (function(vd)
  //   {
  //     videoSettings.deviceId = vd[webcamDeviceIndex].deviceId;
  //   }
  // );

  WebARRocksFaceThreeHelper.init({
    spec: {
      NNCPath: "./NN_FACE_0.json",
      maxFacesDetected  : 1,
      //videoSettings : videoSettings,
      onWebcamAsk : OnWebcamAsk,
      onWebcamGet : OnWebcamGet
    },

    canvas: canvasFace,
    canvasThree: canvasThree,
   

    //update() : detectState 偵測資訊 有無偵測 LandMark位置(2D的) 
    callbackTrack: function (detectState) {
        update(detectState);
    },

    callbackReady: function (err, threeInstances) {
      if (err) {
        $('.retry').css("display", "");
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

    loadSceneFromJson(scenemodelFile);        //載入Json Scene

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
          // mixer = new THREE.AnimationMixer( _threeInstances.threeScene );
          // loopMixer = new THREE.AnimationMixer( _threeInstances.threeScene );

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


              //如果有沒有要跟隨著臉的，就拉到外部
              if(item.userData.notTracking == true)
              {
                nonTrackItem = item;

                //Daron 如果模型位置顯示狀態問題，再從這邊調整位置比例大小
                nonTrackItem.parent = scene;
                nonTrackItem.position.set(0.0,-1.8,-7.0);
                nonTrackItem.scale.x *=1.6;
                nonTrackItem.scale.y *=1.6;
                nonTrackItem.scale.z *=1.6;

              }


              //掃臉的Facemesh
              if(item.userData.facemesh == true)
              {
                  facemesh = item;
                  facemesh.visible = false;
              }

              //掃臉的Facemesh
              if(item.userData.Text_Scanning==true)
              {
                  text_Face_scanning = item;
                  text_Face_scanning.visible = false;
              }

              //掃臉的Facemesh
              if(item.userData.fadeOutPanel==true)
              {
                  fadeOutPanel = item;
                  fadeOutPanel.visible = false;
              }

              //掃臉的Facemesh
              if(item.userData.tex_VIP_intro==true)
              {
                  tex_VIP_intro = item;
                  tex_VIP_intro.visible = false;
              }


              if(item.userData.helmet==true)
              {
                helmetObjs.push(item);
              }

              //Event Animation
              if(item.userData.Animation != null)
              {
                AddAnimations(item);
              }
          });


            _threeInstances.threeRenderer.setAnimationLoop( animate );
            
            SetScriptFromJson(json);

            //OnStartEventAnim();
            setTimeout(OnStartEventAnim,250);//1.5秒後開始播放
            $('.loading').css("display", "none");
        });

  });

}

function SetScriptFromJson(value)
{
  startTime = prevTime = performance.now();

  // document.addEventListener( 'keydown', onKeyDown );
  // document.addEventListener( 'keyup', onKeyUp );
  // document.addEventListener( 'pointerdown', onPointerDown );
  // document.addEventListener( 'pointerup', onPointerUp );
  // document.addEventListener( 'pointermove', onPointerMove );

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

      var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( that, renderer, scene, camera );
      
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

  if(stats!=null)
    stats.update();
}

function main() {
  let mobileAndTabletcheck = function() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };
  
  if(isWebView()){
    $('.block-web').css("display", "");
    $('.loading').css("display", "none");
    return;
  }

  if(mobileAndTabletcheck()){
    $('.btn-video-link').on('click', function(event) {
      window.location = "https://www.spe3d.co/FunkAR_Releases";
    });
  
    $('.btn-retry').on('click', function(event) {
      window.location.reload();
    });
  
    WebARRocksResizer.size_canvas({
      canvasId: "WebARRocksFaceCanvas",
      callback: start,
      isFullScreen: false,
    });
  }
  else{
    $('.block-pc').css("display", "");
    $('.loading').css("display", "none");
  }
  
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

function update(detectState)
{
  
  if(helmetObjs.length!=0)
  {
    helmetObjs.forEach(obj => obj.visible = detectState.isDetected);
  }
  
  const deltaTime = clock.getDelta();
  EffectAnimation(deltaTime);
  //  console.log(detectState);
  if(nowStatus==0)
  {
    if(tex_VIP_intro!=null)
    {
      tex_VIP_intro.material.map = img_VIP;
    }
  }
  else if(nowStatus ==1)
  {
    if(isDetect)//偵測到人臉後1.5秒開始跑動畫
    {
      detectCounter+=deltaTime;
      if(detectCounter>1.5)
      {
        playNextAnimation(); // nowStatus=>2
        detectCounter=0.0;
        isDetect = false;
      }
      return;
    }
    if(detectState.isDetected)
    {
        isDetect = true;
    }
  }

}


// //switch webcam
// function switchDevice()
// {
//   var devices=[];
//   WEBARROCKSFACE.get_videoDevices(
//     function(vd)
//     {
//       devices = vd;

//       if(devices==null)
//       {
//         stopDevice();
//         return;
//       }

//       if(devices.length==0)
//       {
//         stopDevice();
//         return;
//       }

//       webcamDeviceIndex++;
//       if(webcamDeviceIndex>=devices.length)
//       {
//         webcamDeviceIndex = 0;
//       }

//       videoSettings.deviceId = devices[webcamDeviceIndex].deviceId;
//       WEBARROCKSFACE.update_videoSettings(videoSettings);
//       console.log("Device ID : ",webcamDeviceIndex," ",devices[webcamDeviceIndex]);
//     }
//   );
// }

// function stopDevice()
// {
//   WEBARROCKSFACE.update_videoSettings(null);
//   console.log("devices is null");
// }


//for test
//Input test

// document.addEventListener('keyup', function(event) {
//   if (event.keyCode == 37) {
//       switchDevice();
//   }
//   else if (event.keyCode == 32) { //按space或點手機畫面開始
//     console.log('space');
    
//     OnStartEventAnim();
//   }
//   else if (event.keyCode == 65) { //按a開啟
//     console.log('a');
    
//       for(var i = 0 ; i<AniDatas.length;i++)
//       {
//         AniDatas[i].object.visible = true;
//       }
//   }
// }, true);

// document.addEventListener('touchstart', function(event) {
//   // switchDevice();
  
//   OnStartEventAnim();
// }, false);


function SetVogueAnimation(id)
{
  if(id ==0)
  {
    tex_VIP_intro.material.map = img_VIP;
    tex_VIP_intro.material.opacity = 0.0;

    setTimeout(()=>{tex_VIP_intro.visible = true;},1500);
  }
  

  animMixer.forEach(item =>
  {
    item.removeEventListener ( 'finished', playNextAnimation );
  });

  if(id>=(AniDatas.length)) // 播到最後
  {
    console.log('[Play Animation end]');
    nowStatus=0;
    return;
  }


  for(var i = 0 ; i<AniDatas.length;i++)
  {
    if(AniDatas[i].index === id)
    {
        AniDatas[i].object.visible = true;

        AniDatas[i].clipAction.reset();
        AniDatas[i].clipAction.setLoop(THREE.LoopOnce);
        AniDatas[i].clipAction.timeScale = 0.9;
        AniDatas[i].clipAction.clampWhenFinished = true;
        AniDatas[i].clipAction.play();

        

        if(id ==2)
        {
          setTimeout(playNextAnimation,3500);//當播到眼鏡，等1.5秒到下一個淡出
        }else{
          AniDatas[i].mixer.addEventListener('finished',playNextAnimation);
        }
    }
    else
    {
      AniDatas[i].object.visible = false;
    }
  }



}

function OnStartEventAnim()
{
  nowStatus = 0;
  facemesh.visible = false;          
  text_Face_scanning.visible = false;
  tex_VIP_intro.visible = false; 
  fadeOutPanel.visible = false;   
  SetVogueAnimation(0);
}

function playNextAnimation()
{
  nowStatus++;

  // SetVogueAnimation(nowStatus);
  console.log('[play Next]',nowStatus);
  if(nowStatus==1)//等待掃臉
  {
    console.log('facemesh',facemesh);
    tex_VIP_intro.visible = false;
    facemesh.visible = true;
    text_Face_scanning.visible = false;
    
    tex_VIP_intro.visible = true;
    tex_VIP_intro.material.map = img_scan;

  }
  else if(nowStatus==2)//播放掃臉動畫
  {
    SetVogueAnimation(1);
  }
  else if(nowStatus==3)//播放掃臉動畫
  {
    text_Face_scanning.visible = false;
    facemesh.visible = false;
    tex_VIP_intro.visible = true;
    tex_VIP_intro.material.map = img_granted;
    setTimeout(playNextAnimation,1500);
  }
  else if(nowStatus==4)//播放眼鏡動畫
  {
    text_Face_scanning.visible = false;
    tex_VIP_intro.visible = false;
    SetVogueAnimation(2);
  }
  else if(nowStatus==5)//眼鏡動畫結束，播放淡出效果
  {
    fadeOutPanel.material.opacity = 0;
    fadeOutPanel.visible = true;
    setTimeout(playNextAnimation,1500);
  }
  else if(nowStatus==6)//顯示外連按鈕 //Todo :這邊開啟顯示外連按鈕
  {
    console.log('Event Anim Finish!!!!!!!');
    $('.btn-video').css("display", "");
  }
}

function EffectAnimation(deltaTime)
{
    if(tex_VIP_intro!=null && tex_VIP_intro.visible)
    {
      tex_VIP_intro.material.opacity = Math.abs( Math.sin(time/1000.0));
    }

    if(fadeOutPanel!=null && fadeOutPanel.visible)
    {
      fadeOutPanel.material.opacity += deltaTime;
    }

    animMixer.forEach(item =>
      {
        item.update(deltaTime);
      });
}

function isWebView() {
  let useragent = navigator.userAgent;
  let rules = ['WebView','(iPhone|iPod|iPad)(?!.*Safari/)','Android.*(wv|.0.0.0)'];
  let regex = new RegExp(`(${rules.join('|')})`, 'ig');
  return Boolean(useragent.match(regex));
}