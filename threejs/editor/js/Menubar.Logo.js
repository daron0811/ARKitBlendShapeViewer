import { UIPanel, UIRow, UIHorizontalRule } from './libs/ui.js';

function MenubarLogo( editor ) {

	var container = new UIPanel();
	container.setClass( 'menu' );

	var title = new UIPanel();
	title.setClass( 'title' );
	title.setInnerHTML( '<img src ="images/funkar_web_icon.ico" width="20" height="20">');
	container.add( title );

	return container;

}

export { MenubarLogo };
