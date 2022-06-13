var RocksView = {

	Player: function () {

		var Jsonloader = new THREE.ObjectLoader();

		var scene;
		var camera;
		this.loader; //Three Loader 看依載入的類型
		var models; //載入的模型
		
		var detectStateInfo;

		var renderer;
		var _threeInstances;

		var events = {};

		var webcamDeviceIndex=0;

		var canvasFace = document.createElement( 'canvas' );
		canvasFace.width = 600;
		canvasFace.height = 600;

		canvasFace.style.zIndex  = "1";
		canvasFace.style.position= "fixed";
		//canvasFace.style.width= "100vw";
		canvasFace.style.top = "35";
		canvasFace.style.left = "0";
		canvasFace.style.transform = "rotateY(180deg)";
		

		canvasFace.id = 'WebARRocksFaceCanvas';

		var canvasThree = document.createElement( 'canvas' );
		canvasThree.width = 600;
		canvasThree.height = 600;

		canvasThree.style.zIndex  = "2";
		canvasThree.style.position= "fixed";
		canvasThree.style.top = "35";
		canvasThree.style.left = "0";
		canvasThree.style.transform = "rotateY(180deg)";
		canvasThree.id = 'threeCanvas';

		var dom = document.createElement( 'playerdivs' );

		dom.appendChild(canvasFace);
		dom.appendChild(canvasThree);

		this.dom = dom;

		this.width = 500;
		this.height = 500;

		let isInitWebCam = false;

		//animation
		var mixer;
		var animationClips;
		
		var that = this;

		var videoSettings= {
			// 'videoElement'           // not set by default. <video> element used
			'deviceId' :'',             // not set by default
			'facingMode': 'user',       // to use the rear camera, set to 'environment'
			'idealWidth': 800,  // ideal video width in pixels
			'idealHeight': 600, // ideal video height in pixels
			'minWidth': 480,    // min video width in pixels
			'maxWidth': 1920,   // max video width in pixels
			'minHeight': 480,   // min video height in pixels
			'maxHeight': 1920,  // max video height in pixels,
			'rotate': 0,        // rotation in degrees possible values: 0,90,-90,180
			'flipX': false      // if we should flip horizontally the video. Default: false
		  }

		this.load = function ( json ) {

			//console.log(json);
			InitwebCam(json);
		};

		this.isDetected = function ()
		{
			return detectStateInfo.isDetected;
		};

		this.faceRotation = function ()
		{
			return {'x':detectStateInfo.rx,'y':detectStateInfo.ry,'z':detectStateInfo.rz};
		};

		this.facePosition= function ()
		{
			return {'x':detectStateInfo.x,'y':detectStateInfo.y};
		};


				//for test
		document.addEventListener('keyup', function(event) {
			if (event.keyCode == 37) {
				switchDevice();
			}
		}, true);

		function InitwebCam(value)
		{

			if(isInitWebCam)
			{
				SetWebGLRenderer(value.project);
				SetObjectFromScene(value.scene);
				SetScriptFromJson(value);
				renderer.setAnimationLoop( animate );
				return;
			}

			
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
				  videoSettings: videoSettings
				},
				canvas: canvasFace,
				canvasThree: canvasThree,
				
				//update() : detectState 偵測資訊 有無偵測 LandMark位置(2D的) 
				callbackTrack: function (detectState) {
					detectStateInfo = detectState;
				},
			
				callbackReady: function (err, threeInstances) {
				  if (err) {
					console.log("ERROR in main.js: ", err);
					return;
				  }
			
				  	WebARRocksFaceThreeHelper.resize(window.innerWidth, window.innerHeight);

					_threeInstances = threeInstances;

					renderer 	= _threeInstances.threeRenderer;
					scene 		= _threeInstances.threeScene;
					camera 		= _threeInstances.threeCamera;

					
					_threeInstances.threeFaceFollowers[0].scale.x =-1.0;
					
					_threeInstances.threeFaceFollowers[0].scale.y =1.0;
					
					_threeInstances.threeFaceFollowers[0].scale.z =1.0;

					SetWebGLRenderer(value.project);
					SetObjectFromScene(value.scene);
					SetScriptFromJson(value);
					renderer.setAnimationLoop( animate );

					// setScene( Jsonloader.parse( value.scene ) );
					isInitWebCam = true;
				},
			  }); //end WebARRocksFaceThreeHelper.init()
		}

		function SetWebGLRenderer(value)
		{
			var project = value;
			if ( project.vr !== undefined ) renderer.xr.enabled = project.vr;
			if ( project.shadows !== undefined ) renderer.shadowMap.enabled = project.shadows;
			if ( project.shadowType !== undefined ) renderer.shadowMap.type = project.shadowType;
			if ( project.toneMapping !== undefined ) renderer.toneMapping = project.toneMapping;
			if ( project.toneMappingExposure !== undefined ) renderer.toneMappingExposure = project.toneMappingExposure;
			if ( project.physicallyCorrectLights !== undefined ) renderer.physicallyCorrectLights = project.physicallyCorrectLights;

			renderer.outputEncoding = THREE.sRGBEncoding;
		}

		function SetObjectFromScene(value)
		{
			mixer = new THREE.AnimationMixer( _threeInstances.threeScene );
			animationClips =[];
			
			if(value.object.environment!=null)
			{
				_threeInstances.threeScene.environment = Jsonloader.parse( value ).environment;
			}else
			{
				_threeInstances.threeScene.environment = null;
			}

			_threeInstances.threeFaceFollowers[0].add(Jsonloader.parse( value ));


			_threeInstances.threeFaceFollowers[0].traverse((item) => {

				if(item.isLight)
				{
					item.parent = scene;
				}

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

				if(item.animations.length!=0)
				{
					// animationClips.push(item.animations[0]);
					for(var i = 0 ; i<item.animations.length;i++)
					{
						console.log(item.name);
						console.log(i,item.animations[i].name);
						animationClips.push(item.animations[i]);
					}
				}
			});

			ReplayAnimation();

			mixer.addEventListener('finished', (x) => {
				ReplayAnimation();
				// console.log(x);
			  });

			mixer.addEventListener('loop', (x) => {
				//ReplayAnimation();
				// console.log("loop",x);
			});

		}

		function SetScriptFromJson(value)
		{
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

		function ReplayAnimation()
		{
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
		}

		var time, startTime, prevTime;
		
		const clock = new THREE.Clock();

		function animate() {

			time = performance.now();
			
			try {

				dispatch( events.update, { time: time - startTime, delta: time - prevTime } );

			} catch ( e ) {

				console.error( ( e.message || e ), ( e.stack || '' ) );

			}

			renderer.render(_threeInstances.threeScene, _threeInstances.threeCamera );
			prevTime = time;
			const delta = clock.getDelta();

			if(mixer!=null)
			{
				// mixer.update( delta );
				var times = delta*  Math.abs( Math.sin( prevTime )) ;
				mixer.update(times); // 速率
				// mixer.setTime(times);
				// console.log(times);
				// console.log(mixer);
				// console.log(mixer.clipAction( animationClips[0]));
				// console.log(mixer.clipAction( animationClips[0])._clip.duration   ,  mixer.clipAction( animationClips[1])._clip.duration );
			}
			
		}



		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

		};

		this.setScene = function ( value ) {
			_threeInstances.threeFaceFollowers[0].add(value);

			// console.log(value);
			// scene = value;
		};

		this.setPixelRatio = function ( pixelRatio ) {

			renderer.setPixelRatio( pixelRatio );

		};

		this.setSize = function ( width, height ) {
			return;

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			if ( renderer ) {

				renderer.setSize( width, height );

			}

		};

		function dispatch( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}

		this.play = function () {

			// if ( renderer.xr.enabled ) dom.append( vrButton );

			startTime = prevTime = performance.now();

			document.addEventListener( 'keydown', onKeyDown );
			document.addEventListener( 'keyup', onKeyUp );
			document.addEventListener( 'pointerdown', onPointerDown );
			document.addEventListener( 'pointerup', onPointerUp );
			document.addEventListener( 'pointermove', onPointerMove );

			// dispatch( events.start, arguments );

			// if(!renderer)
			// {
			// 	renderer.setAnimationLoop( animate );
			// }
				

		};

		this.stop = function () {

			if ( renderer.xr.enabled ) vrButton.remove();

			document.removeEventListener( 'keydown', onKeyDown );
			document.removeEventListener( 'keyup', onKeyUp );
			document.removeEventListener( 'pointerdown', onPointerDown );
			document.removeEventListener( 'pointerup', onPointerUp );
			document.removeEventListener( 'pointermove', onPointerMove );

			dispatch( events.stop, arguments );

			renderer.setAnimationLoop( null );

		};

		this.render = function ( time ) {

			dispatch( events.update, { time: time * 1000, delta: 0 /* TODO */ } );

			renderer.render( scene, camera );

		};

		this.dispose = function () {


			for (var i = _threeInstances.threeFaceFollowers[0].children.length - 1; i >= 0; i--) {
				_threeInstances.threeFaceFollowers[0].remove(_threeInstances.threeFaceFollowers[0].children[i]);
			}

			renderer.dispose();

		};

		//

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
			}
		);
		}

		function stopDevice()
		{
		WEBARROCKSFACE.update_videoSettings(null);
		console.log("devices is null");
		}

	}

};

export { RocksView };
