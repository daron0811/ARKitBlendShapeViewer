"use strict";
let _threeInstances = null;

var loader; //Three Loader 看依載入的類型
var models; //載入的模型

const clock = new THREE.Clock();
var time, startTime, prevTime;

var touchtime = 0;//double click times

var events = {};

var that = this;
var scene;
var camera;
var renderer;
var canvasFace;
var canvasThree;

var stats;
var webcamDeviceIndex = 0;
// var scenemodelFile = 'funkAR_VOGUEVIPScene.json';
var scenemodelFile = 'ARScene_Chung.json';
var nowStatus = 0;
var isPlayParticle = false;
var viewSize = {width: 0, height: 0};
var shareUrl = "";
var cameraIndex = 0;
var vSetting = {};
var isInits = false;
/*
0:預設顯示箱子，可以旋轉該箱子，左右滑動可旋轉箱子
1:雙擊箱子位置，恢復位置，開始播放動畫
2:播放動畫
3:動畫結束可旋轉卡片,點擊按鈕外連網站
*/

var animMixer=[];

//各項object

var nonTrackItem;       //不被追蹤的物件,picbot，掃臉特效
var AniDatas = [];      //場景上的所有動畫
var helmetObjs = [];      //頭戴的物件，如果沒偵測到臉則關閉

var canPan = false;

var oldvalueX;
var newvalueX;

var oldvalueY;
var newvalueY;

var rotateValueX = 0.0;
var rotateValueY = 0.0;
var isTouch = false;

var deltaTime;

var swipeSpeed=5.;
//

var mouse = new THREE.Vector2( 1, 1 );
var rotateBox;      //物件旋轉的群組物件
var card;           //卡片
var hyberLinkBtn;   //超連結按鈕物件
var tipPlane;       //提示字


var raycaster;

var isLoaded = false;
var isFinish = false;
var finishAniCount = 0;//檢查每個動畫是否都播完了

var img_click = new THREE.TextureLoader().load( 'images/click_icon.png' );
var img_swipe = new THREE.TextureLoader().load( 'images/swipe_icon.png' );

function AddAnimations(item)
{

  var animations = item.animations;
  var mixer = new THREE.AnimationMixer(item);

  var clipActions = {};
  
  for ( var animation of animations ) {

    var mixerAC = mixer.clipAction( animation );

    clipActions[animation.name] = mixerAC;
  }

  // clipAction= mixer.clipAction(item.animations[0]);

  var aniData = {
    'index' :item.userData.Animation,
    'object' :item,
    'clip':item.animations,
    'timeScale':item.userData.timeScale,
    'clipActions':clipActions,
    'mixer':mixer
  }
  item.visible = true;

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

function start(isError, videoSetting) {
  console.log(videoSetting);
  isLoaded = false;
  isFinish = false;
  nowStatus = 0;
  finishAniCount = 0;
  canPan = true;

  // stats = initStats();  
  // get the 2 canvas from the DOM:
  canvasFace  = document.getElementById("WebARRocksFaceCanvas");
  canvasThree = document.getElementById("threeCanvas");

  //取得VideoDevices
  // WEBARROCKSFACE.get_videoDevices
  // (function(vd)
  //   {
  //     videoSettings.deviceId = vd[webcamDeviceIndex].deviceId;
  //   }
  // );
  videoSetting.facingMode = "user";
  videoSetting['idealWidth'] = viewSize.height
  videoSetting['idealHeight'] = viewSize.width
  vSetting = videoSetting;
  WebARRocksFaceThreeHelper.init({
    spec: {
      NNCPath: "./NN_FACE_0.json",
      maxFacesDetected  : 1,
      videoSettings : videoSetting,
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
        if(err !== "ALREADY_INITIALIZED"){
          $('.retry').css("display", "");
        }
        
        console.log("ERROR in main.js: ", err);
        return;
      }

      // WebARRocksFaceThreeHelper.resize(window.innerWidth, window.innerHeight);

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

    _threeInstances.threeFaceFollowers[0].scale.x =1.0;
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
                //nonTrackItem = item;
                item.parent = scene;

                // nonTrackItem.
                // nonTrackItem.scale.x =1.0;
                // nonTrackItem.scale.y =1.0;
                // nonTrackItem.scale.z =-1.0;
                //Daron 如果模型位置顯示狀態問題，再從這邊調整位置比例大小
              }

              //調整主攝影機到設定位置
              // camera.position.set(0.441,0.594,0.788);
              // camera.rotation.set(-24.97 * THREE.MathUtils.DEG2RAD, 28.68*THREE.MathUtils.DEG2RAD, 12.6*THREE.MathUtils.DEG2RAD);
              // camera.fov = 56.71;
              // camera.near = 0.0;

              camera.position.set(0.481,0.634,0.848);
              camera.rotation.set(-24.97 * THREE.MathUtils.DEG2RAD, 28.68*THREE.MathUtils.DEG2RAD, 12.6*THREE.MathUtils.DEG2RAD);
              camera.fov = 56.71;
              camera.near = 0.0;

              //旋轉的群組
              if(item.userData.rotateBox==true)
              {
                 rotateBox = item;
              }

              //卡片物件
              if(item.userData.isCard==true)
              {
                 card = item;
              }

              //外部超連結按鈕
              if(item.userData.isLinkBtn==true)
              {
                  hyberLinkBtn = item;
                  hyberLinkBtn.visible = false;
              }

              //提示字物件
              if(item.userData.TipPlane==true)
              {
                  tipPlane = item;
                  tipPlane.visible = false;
              }

              //Event Animation
              if(item.userData.Animation != null)
              {
                AddAnimations(item);
              }
          });


            _threeInstances.threeRenderer.setAnimationLoop( animate );
            
            SetScriptFromJson(json);

            //todo
            $('#swipe_icon').css('display', "");
            // tipPlane.visible = true;
            // tipPlane.material.map = img_swipe;
            // tipPlane.material.opacity = 1.0;
            isLoaded = true;
            
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
  document.addEventListener(  'dblclick',onDBlclick);

  events = {
    init: [],
    start: [],
    stop: [],
    keydown: [],
    keyup: [],
    pointerdown: [],
    pointerup: [],
    pointermove: [],
    dbclick:[],//新增雙擊
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
  $('.vogue-loading').addClass('none');
  $('.take-photo').css("display", "");
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

  prevTime = time;

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
    $('.vogue-loading').css("display", "none");
    return;
  }

  if(mobileAndTabletcheck()){  
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
    $('.vogue-loading').css("display", "none");
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
  if(!isTouch)
  {
    //todo
    $('#swipe_icon').css('display', "none");
    $('#click_icon').css('display', "");
    // tipPlane.material.map = img_click;
    // tipPlane.material.opacity = 1.0;
  }
  isTouch = true;
}

function onPointerUp( event ) {
  dispatch( events.pointerup, event );
  
  rotateValueX = 0.0;
	rotateValueY = 0.0;

  //double click
  if (touchtime == 0) {
    touchtime = new Date().getTime();
  } else {
    if (((new Date().getTime()) - touchtime) < 800) {
      raycasterItem(event);
      touchtime = 0;
    } else {
      touchtime = 0;
    }
  }

  if(isFinish)
  {
    raycasterItem(event);
  }
}

function onPointerMove( event ) {
  event.preventDefault();
  dispatch( events.pointermove, event );
  RotateItem(event);
}

function onDBlclick( event ) {

  dispatch( events.dbclick, event );
}

function dispatch( array, event ) {

  for ( var i = 0, l = array.length; i < l; i ++ ) {

    array[ i ]( event );

  }

}

function update(detectState)
{
  if(!isLoaded)
  {
    return;
  }
  

  deltaTime  = clock.getDelta();
  animMixer.forEach(item =>{item.update(deltaTime);});
  EffectAnimation(deltaTime);

  if(nowStatus==0)
  {
    //限制旋轉角度
    var limitBoxRot  = THREE.Math.clamp( THREE.Math.radToDeg(rotateBox.rotation.y),-360,360);

    if(limitBoxRot ==360)
    {limitBoxRot =-360;}
    else if(limitBoxRot==-360)
    {limitBoxRot=0;}

    rotateBox.rotation.y = THREE.Math.degToRad(limitBoxRot);

    if(!isTouch)
    {
      rotateBox.rotation.y+=deltaTime;
    }
  }
  else if(nowStatus ==1) // 把箱子恢復到原本位置
  {
    canPan = false;
    var value;
    if(rotateBox.rotation.y>0.0)
    {
      value = rotateBox.rotation.y-(deltaTime*10.0);
      value = THREE.MathUtils.clamp (value,0,rotateBox.rotation.y);
      rotateBox.rotation.y = value;
    }
    else if(rotateBox.rotation.y<0.0)
    {
      value = rotateBox.rotation.y+(deltaTime*10.0);
      value = THREE.MathUtils.clamp (value,rotateBox.rotation.y,0);
    }

    rotateBox.rotation.y = value;

    //回歸位置之後開始下一步進度
    if( Math.abs( value*10) == 0)
    {
      nowStatus++;
      rotateBox.rotation.y = 0.0;
      SetVogueAnimation(0);
      setTimeout(()=>{isPlayParticle = true;},3000);
    }
  }

}

function SetVogueAnimation(id)
{

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

        ///console.log(AniDatas[i].clipActions);
        for (var CA in AniDatas[i].clipActions) {
          AniDatas[i].clipActions[CA].reset();
          AniDatas[i].clipActions[CA].setLoop(THREE.LoopOnce);
          AniDatas[i].clipActions[CA].timeScale = 1.0;
          AniDatas[i].clipActions[CA].clampWhenFinished = true;
          AniDatas[i].clipActions[CA].play();
        }

        AniDatas[i].mixer.addEventListener('finished',playNextAnimation);
    }
    
  }

}

//開始播動畫
//Todo : 開始播動畫
function OnStartEventAnim()
{
  $('.take-photo').css("display", "none");
  $('#click_icon').css('display', "none");
  nowStatus++;
}

//因為VOGUE只有播一段動畫，這邊能直接做結束行為
//Todo : 動畫播完作結束行為
function playNextAnimation()
{
  if(isFinish){return;}
  finishAniCount++;
  if(finishAniCount>=AniDatas.length) // 檢查當每個部件的動畫都播完，才顯示結束畫面按鈕
  {
    nowStatus++;
    isFinish = true;
    hyberLinkBtn.visible = true;// Daron 2021.11.11 : 投資者關閉按鈕不用開啟了
  }
}

function RotateItem(event)
{
	var pointX  = getMousePosition(event).x;
	var pointY  = getMousePosition(event).y;

	if(oldvalueX != null)
	{
		newvalueX = pointX;
		
		if(newvalueX > oldvalueX)
		{
			rotateValueX = -1.0;
		}
		else if(newvalueX < oldvalueX)
		{
			rotateValueX = 1.0;
		}else
		{
			rotateValueX = 0.0;
		}
	}
	
	if(oldvalueY != null)
	{
		newvalueY = pointY;
		
		if(newvalueY > oldvalueY)
		{
			rotateValueY = -1.0;
		}
		else if(newvalueY < oldvalueY)
		{
			rotateValueY = 1.0;
		}else
		{
			rotateValueY = 0.0;
		}
	}
	
	if(nowStatus==0 && isTouch)
	{
		rotateBox.rotation.y -= (rotateValueX / 1)*deltaTime*swipeSpeed;
    
	}else if(nowStatus>=3)	
	{
		card.rotation.z += (rotateValueX / 1)*deltaTime*swipeSpeed;
	}
	oldvalueX = pointX;
	oldvalueY = pointY;
}

function raycasterItem(event)
{
  // if(!isTouch)
  //   false;

	raycaster = new THREE.Raycaster();
	
  mouse = getMousePosition(event);
	
	raycaster.setFromCamera(mouse,camera);
	
	const intersection = raycaster.intersectObject( scene,true );
	
	if ( intersection.length > 0 ) {
		//console.log(intersection[ 0 ].object.name);
		if(intersection[ 0 ].object.userData.isBox && nowStatus==0)
    {
      
      tipPlane.visible = false;
      OnStartEventAnim();
    }
    // Daron 2021.11.11 : 投資者關閉按鈕不用外連
    // else if(intersection[ 0 ].object.userData.isLinkBtn == true && isFinish)
    // {
    //   window.location.href='https://www.spe3d.co/TPEFWxVOGUEFNO_INVITATION';
    // }
		
	}
}

//取得目前滑鼠座標位置(或點擊位置)
function getMousePosition(event)
{
  var pointX;
	var pointY;

  pointX = ( event.clientX / canvasThree.width ) * 2 - 1;
  pointY = - ( event.clientY / canvasThree.height ) * 2 + 1;

  return new THREE.Vector2(pointX,pointY);
}

//原本做特效的部分
function EffectAnimation(deltaTime)
{
  if(tipPlane!=null && tipPlane.visible)
  {
    tipPlane.material.opacity =  Math.abs(Math.sin(time/1000.0));
  }
}

function onLoadImage() {
  if(isInits){
    return;
  }

  isInits = true;
  gtag("event", 'VogueVIP_open_page', {
    'event_label': "VogueVIP",
    'event_category': "vogue_open_page",
  });

  $('body').css('background-color', 'black');
  console.log($('#view-size')[0]);
  let width = $('#view-size')[0].clientWidth;
  let height = $('#view-size')[0].clientHeight;
  viewSize = {width: width, height: height};

  $('#threeCanvas')[0].width = width * 2;
  $('#threeCanvas')[0].height = height * 2;
  $('#threeCanvas').css("width", width);
  $('#threeCanvas').css("height", height);
  $('#WebARRocksFaceCanvas')[0].width = width * 2;
  $('#WebARRocksFaceCanvas')[0].height = height * 2;
  $('#WebARRocksFaceCanvas').css("width", width);
  $('#WebARRocksFaceCanvas').css("height", height);
  $('#mergeView')[0].width = width;
  $('#mergeView')[0].height = height;

  main();
}

function takePhoto() {
  gtag("event", 'VogueVIP_take_photo', {
    'event_label': "VogueVIP",
    'event_category': "vogue_take_photo",
  });

  $('.take-photo').css("opacity", "0");
  html2canvas(document.querySelector("#camera-view"), {
    width: $('#threeCanvas')[0].width,
    height: $('#threeCanvas')[0].height,
    useCORS: true,
    allowTaint: false,
    logging: true
  }).then((canvas) => {
    let ctx = $('#mergeView')[0].getContext('2d');
    let imgCamera = new Image();
    imgCamera.onload = () => {
      ctx.drawImage(imgCamera, 0,0, viewSize.width, viewSize.height);

      //todo fetch
      $.ajax({
        type: "POST",
        url: "https://funk-ar.com/api/v1/share",
        data: {
          card_id: "ForChung",
          img_data: $('#mergeView')[0].toDataURL('image/png')
        },
        success: (result) => {
          shareUrl = result.data.share_link;
          console.log(result)
        }
      });

      $('.take-photo').css("opacity", "1");
      $('.image-preview').removeClass("hide");
      $('.image-vogue-photo')[0].src = canvas.toDataURL('image/png');
    }
    imgCamera.src = canvas.toDataURL('image/png');
  });
}

function onClickSwitchCamera() {
  if(cameraIndex === 0){
    $('#WebARRocksFaceCanvas').addClass("face");
    vSetting.facingMode = "environment"
    cameraIndex = 1;
  }
  else{
    $('#WebARRocksFaceCanvas').removeClass("face");
    vSetting.facingMode = "user"
    cameraIndex = 0;
  }
  WEBARROCKSFACE.update_videoSettings(vSetting);
  
}

function onClickRetake() {
  shareUrl = "";
  $('.image-preview').addClass("hide");
  $('.image-vogue-photo')[0].src = "";
}

function onClickSelectPhoto() {
  gtag("event", 'VogueVIP_share_start_photo', {
    'event_label': "VogueVIP",
    'event_category': "vogue_share_start_photo",
  });

  FB.ui({
    app_id: '808769719726417',
    method: 'share',
    href: shareUrl,
    hashtag: "#FunkAR", 

  }, function(resp) {
  });
}

function isWebView() {
  let useragent = navigator.userAgent;
  let rules = ['WebView','(iPhone|iPod|iPad)(?!.*Safari/)','Android.*(wv|.0.0.0)'];
  let regex = new RegExp(`(${rules.join('|')})`, 'ig');
  return Boolean(useragent.match(regex));
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