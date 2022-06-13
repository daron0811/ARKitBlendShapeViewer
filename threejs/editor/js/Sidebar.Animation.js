import { UIPanel, UIBreak, UISelect, UIButton, UIText, UINumber, UIRow } from './libs/ui.js';

function SidebarAnimation( editor ) {

	var strings = editor.strings;
	var signals = editor.signals;
	var mixer = editor.mixer;

	var actions = {};
	var selectAnimNames;
	var options;

	signals.objectSelected.add( function ( object ) {
		if ( object !== null && object.animations.length > 0 ) {

			var animations = object.animations;

			container.setDisplay( '' );

			selectAnimNames = {};

			options = {};
			var firstAnimation;

			for ( var animation of animations ) {

				if ( firstAnimation === undefined ) firstAnimation = animation.name;

				var mixerAC = mixer.clipAction( animation, object );

				actions[ animation.name ] = mixerAC;
				
				options[ animation.name ] = animation.name;

				selectAnimNames[animation.name] = mixerAC;
				if(mixerAC.isRunning () )
				{
					options[ animation.name ] = '▸ '+animation.name;
				}
			}

			animationsSelect.setOptions( options );
			animationsSelect.setValue( firstAnimation );
			mixerTimeScaleNumber.setValue( mixer.timeScale );

		} else {

			container.setDisplay( 'none' );

		}

	} );

	signals.objectRemoved.add( function ( object ) {

		if ( object !== null && object.animations.length > 0 ) {

			mixer.uncacheRoot( object );

		}

	} );

	function playAction() {

		actions[ animationsSelect.getValue() ].play();
		
		UpdateOption();
	}

	function stopAction() {

		actions[ animationsSelect.getValue() ].stop();

		signals.animationStopped.dispatch();
		
		UpdateOption();
	}

	function PlayAllAction() {

		for (var clipName in selectAnimNames) {
			actions[ clipName ].reset().play();
		}
		
		UpdateOption();
	}

	function PlaySceneAction() {

		// console.log(editor.scene);
		editor.scene.traverse((item) => 
		{
			if( (item.animations != null) && (item.animations.length != 0))
			{
				var animations = item.animations;

				for ( var animation of animations ) {

					if(actions[animation.name] == null)
					{
						var mixerAC = mixer.clipAction( animation, item );
						actions[ animation.name ] = mixerAC;
					}

				}
			}
		});

		for (var clipName in actions) {
			actions[ clipName ].reset().play();
		}
		
		UpdateOption();
	}

	function StopSceneAction() {

		editor.scene.traverse((item) => 
		{
			if( (item.animations != null) && (item.animations.length != 0))
			{
				var animations = item.animations;

				for ( var animation of animations ) {

					if(actions[animation.name] == null)
					{
						var mixerAC = mixer.clipAction( animation, item );
						actions[ animation.name ] = mixerAC;
					}
				}
			}
		});

		for (var clipName in actions) {
			actions[ clipName ].stop();
		}
		
		UpdateOption();
	}

	function StopAllAction() {

		for (var clipName in selectAnimNames) {
			actions[ clipName ].stop();
		}
		UpdateOption();
	}

	function changeTimeScale() {

		mixer.timeScale = mixerTimeScaleNumber.getValue();

	}

	function UpdateOption()
	{
		for (var option in options) {
		   var clipName = actions[ option ]._clip.name;

		   if(actions[ option ].isRunning ())
		   {
				options[clipName] = '▸ '+clipName;
		   }else
		   {
				options[clipName] = clipName;
		   }

		}

		animationsSelect.setOptions( options );
	}

	var container = new UIPanel();
	container.setDisplay( 'none' );

	container.add( new UIText( strings.getKey( 'sidebar/animations' ) ).setTextTransform( 'uppercase' ) );
	container.add( new UIBreak() );
	container.add( new UIBreak() );


	var animationsRow = new UIRow();

	var animationsSelect = new UISelect().setFontSize( '12px' );
	animationsRow.add( animationsSelect ).onChange(()=>{UpdateOption});
	animationsRow.add( new UIButton( strings.getKey( 'sidebar/animations/play' ) ).setMarginLeft( '4px' ).onClick( playAction ) );
	animationsRow.add( new UIButton( strings.getKey( 'sidebar/animations/stop' ) ).setMarginLeft( '4px' ).onClick( stopAction ) );
	animationsRow.add( new UIButton( 'Play All' ).setMarginLeft( '4px' ).onClick( PlayAllAction ) );
	animationsRow.add( new UIButton( 'Stop All' ).setMarginLeft( '4px' ).onClick( StopAllAction ) );
	animationsRow.add( new UIButton( 'Play Scene' ).setMarginLeft( '4px' ).onClick( PlaySceneAction ) );
	animationsRow.add( new UIButton( 'Stop Scene' ).setMarginLeft( '4px' ).onClick( StopSceneAction ) );
	container.add( animationsRow );

	//

	var mixerTimeScaleRow = new UIRow();
	var mixerTimeScaleNumber = new UINumber( 0.5 ).setWidth( '60px' ).setRange( - 10, 10 ).onChange( changeTimeScale );

	mixerTimeScaleRow.add( new UIText( strings.getKey( 'sidebar/animations/timescale' ) ).setWidth( '90px' ) );
	mixerTimeScaleRow.add( mixerTimeScaleNumber );

	container.add( mixerTimeScaleRow );

	return container;

}

export { SidebarAnimation };
