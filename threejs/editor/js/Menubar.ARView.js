import { UIPanel } from './libs/ui.js';

function MenubarARView( editor ) {

	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIPanel();
	container.setClass( 'menu' );

	var isPlaying = false;

	var title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( 'AR' );
	title.onClick( function () {

		if ( isPlaying === false ) {

			isPlaying = true;
			title.setTextContent( 'Stop AR' );
			signals.startARPlayer.dispatch();

		} else {

			isPlaying = false;
			title.setTextContent( 'AR' );
			signals.stopARPlayer.dispatch();

		}

	} );
	container.add( title );

	return container;

}

export { MenubarARView };
