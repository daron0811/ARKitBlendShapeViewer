import { UIPanel ,UIButton} from './libs/ui.js';

import { MenubarAdd } from './Menubar.Add.js';
import { MenubarLogo } from './Menubar.Logo.js';
import { MenubarComponent } from './Menubar.Component.js';
import { MenubarEdit } from './Menubar.Edit.js';
import { MenubarFile } from './Menubar.File.js';
import { MenubarExamples } from './Menubar.Examples.js';
import { MenubarView } from './Menubar.View.js';
import { MenubarHelp } from './Menubar.Help.js';
import { MenubarPlay } from './Menubar.Play.js';
import { MenubarARView } from './Menubar.ARView.js';
import { MenubarStatus } from './Menubar.Status.js';

function Menubar( editor ) {

	var container = new UIPanel();
	container.setId( 'menubar' );

	container.add( new MenubarLogo( editor ) );
	container.add( new MenubarFile( editor ) );
	container.add( new MenubarEdit( editor ) );
	container.add( new MenubarAdd( editor ) );
	container.add( new MenubarComponent( editor ) );
	container.add( new MenubarPlay( editor ) );
	container.add( new MenubarARView( editor ) );
	container.add( new MenubarExamples( editor ) );
	container.add( new MenubarView( editor ) );
	container.add( new MenubarHelp( editor ) );

	container.add( new MenubarStatus( editor ) );

	return container;

}

export { Menubar };
