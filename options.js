
Storage.storage_upgrades();

var ACTIVATORS = {
	'disabled' : 'Disabled',
	'click' : 'Mouse Click',
	'auto' :  'Auto',
// 	'contextmenu' : 'Context Menu',
	'k_and_m' : 'Keyboard shortcut + Mouse click'
}

var CONTEXTMENU_OPTIONS = {
	'disabled' : 'Disabled',
	'enabled' :  'Enabled'
}
var _G_folder_id_count = 0;
var _G_engine_id_count = 0;


function addNewEngine(en, level){

	++_G_engine_id_count;


	var name = en.name,
		url = en.url,
		icon_url = en.icon_url,
		post = en.post || false,
		is_folder = en.is_folder || false;

	level = level || 0;

	icon_url = icon_url == undefined ||
				icon_url.length == 0 ? '(Use default)' : icon_url;

	var tr = $('<tr></tr>');

	tr.append($('<td class="drag-target"></td>').css('background', 'url("'+chrome.extension.getURL('move.png')+'") no-repeat center center'));
	tr.append($('<td></td>').append($('<input class="name" type="text" />').val(name)));


	var _url = $('<input class="url" type="text" />');
	if(!is_folder)
		_url.val(url)
	else
		_url.val('Folder').attr('disabled', true);

	tr.append($('<td></td>').append(_url));
	tr.append($('<td></td>').append($('<input class="icon_url" type="text" />').val(icon_url)));

	tr.find('input.icon_url').focus(function (){

		if ($(this).val() == '(Use default)')
			$(this).val('');

	}).blur(function (){

		if (!$(this).val())
			$(this).val('(Use default)');

	});


	var options_popup = $('<div class="engine-options-popup"></div>');


	options_popup.append($('<a href="#" class="close-popup"></a>').click(function(){

			options_popup.fadeOut(100);
			return false;

		})
	);

	
	options_popup.append('<label for="engine-opt-post-'+_G_engine_id_count+'">Use POST method</label><input class="post" id="engine-opt-post-'+_G_engine_id_count+'" type="checkbox" />');

	options_popup.append('<hr /><p><strong>Show in:</strong></p>');

	options_popup.append('<p><input class="hide_in_ctx" id="engine-opt-ctx-'+_G_engine_id_count+'" type="checkbox" /> <label for="engine-opt-ctx-'+_G_engine_id_count+'">Context menu</label></p>');
	options_popup.append('<p><input class="hide_in_popup" id="engine-opt-popup-'+_G_engine_id_count+'" type="checkbox" /> <label for="engine-opt-popup-'+_G_engine_id_count+'">Popup</label></p>');
	options_popup.append('<p class="separate-menus-msg">This only has effect when the "Separate search engines" option is checked below in "Other Options" section.</p>');

	if(!en.hide_in_popup){
		options_popup.find('.hide_in_popup').attr('checked', true);
	}
	if(!en.hide_in_ctx){
		options_popup.find('.hide_in_ctx').attr('checked', true);
	}
	if(en.post){
		options_popup.find('.post').attr('checked', true);
	}
		
	var opt_link = $('<a href="#" class="engine-opts-link">&nbsp;</a>').hover(

		function(){
			$(this).parent().parent().addClass('options-hover');
		},
		function(){
			$(this).parent().parent().removeClass('options-hover');
		}
	).click(function(){

		$('.engine-options-popup').not(options_popup).hide();
	
		var x = $(this).offset().left - options_popup.outerWidth()-4;
		var y = $(this).offset().top;

		options_popup.css({top:y+'px', left:x+'px'});
		options_popup.fadeToggle(100);
		return false;
	});
	
	tr.append($('<td></td>').append(opt_link).append(options_popup.hide()));

	tr.append($('<td></td>').append($('<a href="#" class="delete">X</a>').hover(

		function(){
			$(this).parent().parent().addClass('options-hover');
		},
		function(){
			$(this).parent().parent().removeClass('options-hover');
		}

	).click(function(){

		var tr = $(this).parent().parent();

		if(tr.hasClass('menu-folder')){

			var elms = tr.nextUntil('#end-'+tr.attr('id'));

			$('#end-'+tr.attr('id')).remove();


			elms.each(function(){$(this).data('level', $(this).data('level')-1);});

			Reorder.initElements(elms);


		}

		tr.remove();
		return false;
	})

	
	));


	Reorder.makeMovable(tr);


	$('#engines').append(tr);

	tr.data('level', level);


	if(!is_folder){

		tr.attr('id', 'search-engine-'+(_G_engine_id_count));
		tr.addClass('search-engine');
		Reorder.initElements(tr);

		return;
	}

	tr.addClass('menu-folder');

	var id = 'folder-'+(++_G_folder_id_count);
	tr.attr('id', id);


	var engines = en.engines || [];
	
	for(var i=0,e=engines.length; i<e; ++i){
		addNewEngine(engines[i], level+1);
	}
	

	
	var end = $('<tr id="end-'+id+'" class="menu-folder-end"><td></td><td colspan="5"></td></tr>').data('level', level+1);


	Reorder.initElements(tr);
	Reorder.initElements(end);
	
	$('#engines').append(end);

	
}




$(document).ready(function(){

	Common.init();
	
	var popup = new PopUp();


	// The style system has changed.
	// Check if the user has changed the style. If it hasn't we can clear the stored style.
	var stored_style = Storage.getStyle('');
	if (stored_style == $('#old-default-style').val())
		Storage.setStyle('');

	var CURRENT_STYLE = '';
	var hotkey_editor = null;

	chrome.extension.sendRequest({}, function(response){

		popup.setOptions(response.options);
		Common.setStyleSheet(response.default_style);
		if(response.extra_style)
			Common.setStyleSheet(response.extra_style);

		for (i in response.searchEngines){
			var en = response.searchEngines[i];

			if(i < 3) // add 3 engines for preview
				popup.addSearchEngine(en);


			addNewEngine(en, 0);
		}


		if(response.extra_style){

			CURRENT_STYLE= response.extra_style;
			$('#select_theme').prepend('<option selected="selected" value="current_style">&lt;Current Style&gt;</option>');
		}

		$('#preview').append(popup.getForPreview());
		$('#preview-button').append(popup.getButtonForPreview());


		$("input[name='button']").filter("[value="+response.options.button+"]").attr('checked', true);

		$("input[name='newtab']").attr('checked', response.options.newtab);
		$("input[name='background_tab']").attr('checked', response.options.background_tab);

		$("input[name='show_in_inputs']").attr('checked', response.options.show_in_inputs);


		$("#select_activator option[value='"+response.options.activator+"']").attr('selected', true);
		$("#select_activator").change();

		$('#select_theme').change();


		$('input[name=remove_icons][value='+response.options.remove_icons+']').attr('checked', true).change();
		$('input[name=use_default_style]').attr('checked', response.options.use_default_style);


		hotkey_editor = HotKeys.createHotkeyInput('#k_and_m_keys', response.options.k_and_m_combo.slice(0, -1));
		$("#k_and_m_button").val(response.options.k_and_m_combo[response.options.k_and_m_combo.length-1]);



		$("#contextmenu_option option[value='"+response.options.context_menu+"']").attr('selected', true);
		$("#contextmenu_option").change();


		$("#opt-separate-engines").attr('checked', response.options.separate_menus).change();
		
	});


	$('#search-icon').append('<img src="'+chrome.extension.getURL('icon16.png')+'" width="16px" height="16px" />');

	$('#new-engine').click(function(){

		addNewEngine({name:'', url:'', icon_url:''}, 0);

		return false;
	});

	$('#new-folder').click(function(){
		addNewEngine({name:'New Folder', url:'', icon_url:'', is_folder:true}, 0);

		return false;
	});

	$('#save').click(function(){


		var folder_stack = [{engines:[]}]; // folder stack with the root item

		$('#engines tr:gt(0)').each(function(index){

			var en = {};

			$(this).find('input').each(function(){
				if ($(this).attr('type') == 'checkbox')
					en[$(this).attr('class')] = $(this).is(':checked');
				else
					en[$(this).attr('class')] = $(this).val();
			});

			if(en.icon_url == '(Use default)')
				delete en.icon_url;
			if(!en.post)
				delete en.post;


			if(en.hide_in_popup)
				delete en.hide_in_popup;
			else
				en.hide_in_popup = true;
		
			if(en.hide_in_ctx)
				delete en.hide_in_ctx;
			else
				en.hide_in_ctx = true;


			if($(this).hasClass('menu-folder')){

				en.is_folder = true;
				en.engines = [];

				folder_stack[folder_stack.length-1].engines.push(en);
				folder_stack.push(en);

			}
			else if($(this).hasClass('menu-folder-end')){
				folder_stack.pop()
// 				current_folder = null;
			}
			else if(en.name && en.url){

				folder_stack[folder_stack.length-1].engines.push(en);
			}
		});

		// When we get here only the root item should vbe left
		var new_engines = folder_stack[0].engines;



		var k_and_m_combo = hotkey_editor.getCombo();
		k_and_m_combo.push(parseInt($("#k_and_m_button").val(), 10));


		Storage.setSearchEngines(new_engines);
		Storage.setStyle(jQuery.trim($('#style').val()));

		Storage.setOptions({
			button: parseInt($("input[name='button']:checked").val(), 10),
			newtab: $("input[name='newtab']").is(':checked'),
			background_tab: $("input[name='background_tab']").is(':checked'),
			activator: $('#select_activator option:selected').first().attr('value'),
			remove_icons:$('input[name=remove_icons]:checked').val(),
			use_default_style: $('input[name=use_default_style]').is(':checked'),
			show_in_inputs: $('input[name=show_in_inputs]').is(':checked'),
			k_and_m_combo:k_and_m_combo,
			context_menu: $('#contextmenu_option option:selected').first().attr('value'),
			separate_menus: $('#opt-separate-engines').is(':checked')
		});


		chrome.extension.sendRequest({action:"optionsChanged"});

		location.reload();

	});


	$('#restore').click(function(){


		if(confirm("This will delete all your search engines and reset all the changes you have made")){

			Storage.clear();
			location.reload();
		}
		return false;
	});

	$('#update-preview').click(function(e){

		Common.setStyleSheet($('#style').val());

		return false;
	});

	var theme_select = $('#select_theme');

	$('.theme_def').each(function(){
		theme_select.append('<option value="' + $(this).attr('id')+'">'+$(this).attr('name')+'</option>');
	});

	theme_select.change(function(){

		var opt = $('#select_theme option:selected').first();

		var id = opt.attr('value');

		if(id == 'current_style'){
			Common.setStyleSheet(CURRENT_STYLE)
			$("#style").val(CURRENT_STYLE);
			return;
		}

		var css = $('textarea#' + id).val();

		$("#style").val(css);

		Common.setStyleSheet(css);

	});

	for (var act in ACTIVATORS){

		var name = ACTIVATORS[act];

		$('#select_activator').append('<option value="' + act + '">'+name+'</option>');
	}

	$('#select_activator').change(function(){

		var opt = $('#select_activator option:selected').first();

		var val = opt.attr('value');
		if(val == 'disabled')
			$('#show-advanced-popup-opts').hide();
		else
			$('#show-advanced-popup-opts').show();
		
		$('.activator_options').hide(100);
		$('#activator_' + opt.attr('value')).show(100);

	});

	for (var act in CONTEXTMENU_OPTIONS){

		var name = CONTEXTMENU_OPTIONS[act];
		$('#contextmenu_option').append('<option value="' + act + '">'+name+'</option>');
	}


	$('#contextmenu_option').change(function(){

		var opt = $('#contextmenu_option option:selected').first();

		var val = opt.attr('value');
		if(val == 'disabled')
			$('#contextmenu_active').hide(100);
		else
			$('#contextmenu_active').show(100);

	});



	$('#show_customize').click(function(){
		$('#customize').toggle();

		return false;
	});


	$('#show_html').click(function(){
		$('#html').toggle();
		return false;
	});


	$('input[name=remove_icons]').change(function(){

		if($(this).val() == 'https')
			$('#use_default_style').show(100);
		else
			$('#use_default_style').hide(100);
	});


	$('#k_and_m_keys').focus(function(){

		var top = $(this).offset().top - $("#hotkey_info").outerHeight() - 5;

		$("#hotkey_info").css({'top' : top+ 'px', 'left' : $(this).offset().left + 'px'});

		$("#hotkey_info").show(100);
	});

	$('#k_and_m_keys').blur(function(){
		$("#hotkey_info").hide(100);
	});



	$('#opt-separate-engines').change(function(){

		$('#wrap-edit-separate-engines').toggle($(this).is(':checked'));

	});

	

	function _load_export(){


		var export = {}

		if($('#export-search-engines').is(':checked'))
			export.searchEngines = Storage.getSearchEngines();
		if($('#export-style').is(':checked'))
			export.styleSheet =  Storage.getStyle();
		if($('#export-options').is(':checked'))
			export.options =  Storage.getOptions();

		if(!jQuery.isEmptyObject(export)){

			if(localStorage.hasOwnProperty('VERSION'))
				export.VERSION = localStorage['VERSION'];

			export = JSON.stringify(export);

// 			if($('#encode-output').is(':checked'))

			try{
				export = btoa(export);
			}catch(e){
				export = '1e:' + btoa(encodeURI(export));
			}

		}else
			export = '';

		$('#export-settings textarea').val(export);

	}

	var _import_decoders = {
		'1e' : function(v){return JSON.parse(decodeURI(atob(v)))},
		'1' : function(v){return JSON.parse(atob(v))}
	}


	function _do_import(){


		var import = $('#import-settings textarea').val();

		if(import.length == 0){
			alert('No data to import');
			return;
		}

		try{

			var parts = import.split(':');

			var decoder = '1';

			if(parts.length == 2){
				import = parts[1];
				decoder = parts[0];
			}

			if(decoder in _import_decoders)
				import = _import_decoders[decoder](import);
			else
				import = null;

		}catch(err){
			import = null;
		}
		if(!import || jQuery.isEmptyObject(import)){
			alert('Failed to import data');
			return;
		}


		if( !$('#import-search-engines').is(':checked') &&
			!$('#import-style').is(':checked') &&
			!$('#import-options').is(':checked')){
			alert('No data imported');
			return;
		}

		var msg = [];

		if($('#import-search-engines').is(':checked')){

			if(!import.hasOwnProperty('searchEngines'))
				msg.push('Search Engines: not available');
			else{

				msg.push('Search Engines: OK');

				if($('#import-replace-engines').is(':checked')){
					Storage.setSearchEngines(import.searchEngines);
				}else{
					var prev_engines = Storage.getSearchEngines();
					Storage.setSearchEngines(prev_engines.concat(import.searchEngines));
				}
			}
		}

		if($('#import-style').is(':checked')){

			if(!import.hasOwnProperty('styleSheet'))
				msg.push('Styling: not available');
			else{
				msg.push('Styling: OK');
				Storage.setStyle(import.styleSheet);
			}

		}

		if($('#import-options').is(':checked')){

			if(!import.hasOwnProperty('options'))
				msg.push('Other settings: not available');
			else{
				msg.push('Other settings: OK');
				Storage.setOptions(import.options);
			}
		}

		alert('Settings has been imported.\n\n' + msg.join('\n'));

		chrome.extension.sendRequest({action:"optionsChanged"});
		
		location.reload();

	}


	$('#export-settings-link').click(function(){

		$(this).toggleClass('selected');

		$('#import-settings').slideUp(200);

		$('#import-settings-link').removeClass('selected');


		$('#export-settings').slideToggle(200, function(){



			if($('#export-settings').is(':visible')){
				_load_export();
			}

		});

		var destination = $("body").offset().top + $("body").height();
		$("body").animate({ scrollTop: destination},200);

		return false;
	});


	$('#export-settings input').change(function(){
		_load_export();
	});

	$('#export-settings textarea').click(function(){
		this.select();
	});


	$('#import-settings-link').click(function(){

		$(this).toggleClass('selected');


		$('#export-settings').slideUp(200);


		$('#export-settings-link').removeClass('selected');


		$('#import-settings').slideToggle(200, function(){



		});
		var destination = $("body").offset().top + $("body").height();
		$("body").animate({ scrollTop: destination},200);

		return false;
	});

	$('#import-search-engines').change(function(){

		if($(this).is(':checked'))
			$('#import-replace-engines-opt').slideDown(100);
		else
			$('#import-replace-engines-opt').slideUp(100);

	});


	$('#import-submit').click(function(){

		var msg = ['This will overwrite you existing settings'];

		if($('#import-replace-engines').is(':checked'))
			msg.push('\nand your search engines');

		msg.push('.\n\nAre you sure you want to continue?');

		if(confirm(msg.join('')))
			_do_import();

	});



	$('#show-more-variables').click(function(){

		if($(this).data('old-text')){
			$(this).text($(this).data('old-text')).removeData('old-text');
		}else{
			$(this).data('old-text', $(this).text()).text('Hide');
		}




		$('#more-variables').slideToggle();

		return false;
	});


	$('#show-advanced-popup-opts').click(function(){

		$('#popup-advanced-options').slideToggle();
		return false;
	});

});