import { UIPanel, UIRow, UISelect, UISpan, UIText,UIInput} from './libs/ui.js';

function SidebarAssets( editor ) {

	var config = editor.config;
	var strings = editor.strings;

	console.log(editor);

	var container = new UISpan();

	var settings = new UIPanel();
	settings.setBorderTop( '0' );
	settings.setPaddingTop( '20px' );
	container.add( settings );

	// var materials={};

	var matOptions = {
		en: 'English',
		fr: 'Français',
		zh: '中文'
	};

	GetMaterials();
	
	function GetMaterials()
	{
		console.log(editor);
		console.log(editor.materials);
		console.log(editor.scene.toJSON());
		Object.entries(editor.materials).forEach(([key, value]) => {
            console.log(`${key} ${value}`);
        });
	}

	var options = {
		en: 'English',
		fr: 'Français',
		zh: '中文'
	};

	//language

	var titleRow = new UIRow();
	var title = new UIInput( config.getKey( 'project/title' ) ).setLeft( '100px' ).setWidth( '150px' ).onChange( function () {
		GetMaterials();
	} );

	titleRow.add( new UIText( strings.getKey( 'sidebar/project/title' ) ).setWidth( '90px' ) );
	titleRow.add( title );

	settings.add( titleRow );


	//language

	var languageRow = new UIRow();
	var language = new UISelect().setWidth( '150px' );
	language.setOptions( options );

	if ( config.getKey( 'language' ) !== undefined ) {

		language.setValue( config.getKey( 'language' ) );

	}

	language.onChange( function () {

		var value = this.getValue();

		editor.config.setKey( 'language', value );

	} );

	languageRow.add( new UIText( strings.getKey( 'sidebar/settings/language' ) ).setWidth( '90px' ) );
	languageRow.add( language );

	settings.add( languageRow );

	// var languageRow = new UIRow();
	// var language = new UISelect().setWidth( '150px' );
	// language.setOptions( options );

	// if ( config.getKey( 'language' ) !== undefined ) {

	// 	language.setValue( config.getKey( 'language' ) );

	// }


	// var settings = new UIPanel();
	// settings.setBorderTop( '0' );
	// settings.setPaddingTop( '20px' );
	// container.add( settings );

	// // language

	// var options = {
	// 	en: 'English',
	// 	fr: 'Français',
	// 	zh: '中文'
	// };

	// var languageRow = new UIRow();
	// var language = new UISelect().setWidth( '150px' );
	// language.setOptions( options );

	// if ( config.getKey( 'language' ) !== undefined ) {

	// 	language.setValue( config.getKey( 'language' ) );

	// }

	// language.onChange( function () {

	// 	var value = this.getValue();

	// 	editor.config.setKey( 'language', value );

	// } );

	// languageRow.add( new UIText( strings.getKey( 'sidebar/settings/language' ) ).setWidth( '90px' ) );
	// languageRow.add( language );

	// settings.add( languageRow );

	// //

	// container.add( new SidebarSettingsViewport( editor ) );
	// container.add( new SidebarSettingsShortcuts( editor ) );
	// container.add( new SidebarSettingsHistory( editor ) );

	// signals.editorCleared.add( function () {

	// 	title.setValue( '' );
	// 	config.setKey( 'project/title', '' );

	// } );

	return container;

}

export { SidebarAssets };
