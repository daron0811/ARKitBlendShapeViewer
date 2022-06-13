import { UITabbedPanel, UISpan } from './libs/ui.js';

import { SidebarScene } from './Sidebar.Scene.js';
import { SidebarProperties } from './Sidebar.Properties.js';
import { SidebarScript } from './Sidebar.Script.js';
import { SidebarAnimation } from './Sidebar.Animation.js';
import { SidebarProject } from './Sidebar.Project.js';
import { SidebarSettings } from './Sidebar.Settings.js';
import { SidebarAssets } from './Sidebar.Assets.js';

function Sidebar( editor ) {

	var strings = editor.strings;

	var container = new UITabbedPanel();
	container.setId( 'sidebar' );

	var scene = new UISpan().add(
		new SidebarScene( editor ),
		new SidebarProperties( editor ),
		new SidebarAnimation( editor ),
		new SidebarScript( editor )
	);
	var project = new SidebarProject( editor );
	var settings = new SidebarSettings( editor );
	var assets = new SidebarAssets( editor );

	container.addTab( 'scene', strings.getKey( 'sidebar/scene' ), scene );
	container.addTab( 'project', strings.getKey( 'sidebar/project' ), project );
	
	container.addTab( 'settings', strings.getKey( 'sidebar/settings' ), settings );
	// container.addTab( 'asset', 'asset', assets ); // TODO: 列出目前該場景用的貼圖跟材質球
	container.select( 'scene' );

	return container;

}

export { Sidebar };
