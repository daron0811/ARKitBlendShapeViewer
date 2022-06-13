import { UIPanel } from './libs/ui.js';
import { RocksView } from './libs/RocksView.js';



function ARViewport( editor ) {
	
	var signals = editor.signals;

	var container = new UIPanel();
	container.setId( 'player' );
	container.setPosition( 'absolute' );
	container.setDisplay( 'none' );

	//

	var player = new RocksView.Player();
	container.dom.appendChild( player.dom );

	window.addEventListener( 'resize', function () {

		player.setSize( container.dom.clientWidth, container.dom.clientHeight );

	} );

	signals.startARPlayer.add( function () {

		container.setDisplay( '' );

		// console.log( JSON.stringify(editor));
		player.load( editor.toJSON() );
		player.setSize( container.dom.clientWidth, container.dom.clientHeight );
		player.play();

	} );

	signals.stopARPlayer.add( function () {

		container.setDisplay( 'none' );

		player.stop();
		player.dispose();

	} );

	return container;

}

export { ARViewport };
