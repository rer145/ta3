'use strict';

window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

const fs = require('fs');
const find = require('find');
const path = require('path');
const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;

const Store = require('electron-store');
const store = new Store();

var sudo = require('sudo-prompt');

const requiredPackages = [
	'gtools',
	'MASS',
	'foreach',
	'iterators',
	'doParallel',
	'randomGLM',
	'glmnet',
	'msir'
];

var current_traits = null;
var current_trait_idx = -1;
var current_section_idx = -1;
var selections = [];

var current_trait_text = -1;
var current_section_text = -1;

$(document).ready(function() {
	app_init();
});

function app_init() {
	window.appdb = load_database();
	window.current_file = "";
	window.is_dirty = false;
	
	populate_settings();
	wire_event_handlers();
	show_welcome_screen();
}

function load_database() {
	var db = JSON.parse(fs.readFileSync(path.join(__dirname, "/assets/db/db.min.json")).toString());
	return db;
}

function populate_settings() {
	$("#current-version").text(store.get('version'));

	var entry_mode = store.get('config.entry_mode');
	if (entry_mode.length > 0) {
		$("#entry_mode_" + entry_mode).attr('checked', 'checked');
	} else {
		$("#entry_mode_basic").attr('checked', 'checked');
		store.set("config.entry_mode", "basic");
	}
}

function wire_event_handlers() {
	$("#welcome-new-case").click(function(e) {
		e.preventDefault();
		new_case();
		show_screen('case-screen');
	});

	$("#welcome-load-case").click(function(e) {
		e.preventDefault();
		open_case();
	});

	$("#load-case").click(function(e) {
		e.preventDefault();
		open_case();
	});

	$("#settings-modal").on("click", ".rscript-settings-link", function() {
		store.set('config.r_executable_path', $(this).text());
		$("#settings-rscript-path").html(store.get('config.r_executable_path'));
	});
	
	$('#settings-modal').on('show.bs.modal', function (e) {
		$("#settings-rscript-path").html(store.get('config.r_executable_path'));
		populate_settings();
		show_suggested_rscript_paths();
	});

	$("#rscript_file_input").change(function(e) {
		var reader = new FileReader();
		var path = e.currentTarget.files[0].path;
		if (path.length > 0) {
			store.set('config.r_executable_path', path);
			$("#settings-rscript-path").html(store.get('config.r_executable_path', ''));
		}
	});
	
	$("input:radio[name='settings_entry_mode']").change(function(e) {
		console.log($(this).val());
		store.set('config.entry_mode', $(this).val());
	});

	$("#save-setting-button").click(function(e) {
		$("#settings-modal").modal('hide');
		check_config_settings();
	});
	
	$("#save-button").click(function(e) {
		e.preventDefault();
		save_case();
	});

	$("#save-analysis-button").click(function(e) {
		e.preventDefault();
		save_case();
	});

	$("#main-tabs a").click(function(e) {
		e.preventDefault();
		//console.log($(this).attr("id"));
		$(this).tab('show');
	});
	
	$(".reset-button").click(function(e) {
		new_case();
	});
	
	$("#analysis-button").click(function(e) {
		$('#main-tabs a[href="#selections"]').tab('show');
	});
	
	$("#analysis-review-button").click(function(e) {
		$('#main-tabs a[href="#results"]').tab('show');
		$('#main-tabs a[href="#results"]').show();
		//$('#main-tabs a[href="#charts"]').show();
	
		run_analysis();
	});
	
	$("#trait-pager").on("click", ".previous", function() {
		if (!$(this).hasClass("disabled")) {
			current_trait_idx--;
			var temp = data_get_trait(current_section_idx, current_trait_idx);
			current_trait_text = temp.db_name;
			update_pager_buttons();
			populate_trait_prompt(current_traits[current_trait_idx]);
		}
	});
	
	$("#trait-pager").on("click", ".next", function() {
		if (!$(this).hasClass("disabled")) {
			current_trait_idx++;
			var temp = data_get_trait(current_section_idx, current_trait_idx);
			current_trait_text = temp.db_name;
			update_pager_buttons();
			populate_trait_prompt(current_traits[current_trait_idx]);
		}
	});
	
	$("#section-menu").on("click", ".list-group-item", function() {
		$('#main-tabs a[href="#evaluation"]').tab('show');
		select_section($(this));
	});
	
	$("body").on("click", ".adv-radio", function() {
		var btn = $(this);
		var identifier = String(btn.attr("data-section-text")) + "-" + String(btn.attr("data-trait-text")) + "-" + String(btn.attr("data-score-text"));


		toggle_score_selection_text(
			btn.attr("data-section-text"),
			btn.attr("data-trait-text"),
			btn.attr("data-score-text")
		);

		var group = $("body").find("div.btn-group[data-trait-text=" + String(btn.attr("data-trait-text")) + "]");
		$.each($(".adv-radio", group), function(k,v) {
			if ($(this).data("identifier") !== identifier) {
				$(this).removeClass("active");
			} else {
				if ($(this).hasClass("active")) {
					$(this).removeClass("active");
				} else {
					$(this).addClass("active");
				}
			}
		});
	});

	$("body").on('change', '.dirtyable', function() {
		console.log('changed');
		window.is_dirty = true;
		update_file_status();
	});
	
	$("body").on("click", ".trait-score-button", function() {
		// var identifier = String($(this).attr("data-section-idx")) + "-" + String($(this).attr("data-trait-idx")) + "-" + String($(this).attr("data-score-idx"));

		var identifier = String($(this).attr("data-section-text")) + "-" + String($(this).attr("data-trait-text")) + "-" + String($(this).attr("data-score-text"));

		var btn = $(this);
		
		// toggle_score_selection(
		// 	$(this).attr("data-section-idx"),
		// 	$(this).attr("data-trait-idx"),
		// 	$(this).attr("data-score-idx")
		// );
		toggle_score_selection_text(
			$(this).attr("data-section-text"),
			$(this).attr("data-trait-text"),
			$(this).attr("data-score-text")
		);
	
		//toggle_trait_score_selection(identifier, $(this));
	
		$.each($(".trait-score"), function(k,v) {
			if ($(this).data("identifier") !== identifier) {
				$(this).parent().removeClass("selected");
				$(this).find(".trait-score-button")
					.removeClass("btn-warning")
					.addClass("btn-success")
					.text("Select");
			} else {
				if ($(this).parent().hasClass("selected")) {
					$(this).parent().removeClass("selected");
					btn.removeClass("btn-warning")
						.addClass("btn-success")
						.text("Select");
				} else {
					$(this).parent().addClass("selected");
					btn.addClass("btn-warning")
						.removeClass("btn-success")
						.text("Deselect");
				}
			}
		});
	});
	
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		if ($(e.target).attr("aria-controls") === "caseinfo") {
			$("#section-menu .list-group-item").removeClass("active");
		}
		
		if ($(e.target).attr("aria-controls") === "evaluation") {
			$("#section-menu .list-group-item").removeClass("active");
			$("#evaluation-content-empty").show();
			$("#evaluation-content").hide();
		}
	
		if ($(e.target).attr("aria-controls") === "selections") {
			$("#section-menu .list-group-item").removeClass("active");
			show_current_selections_text();
		}
	
		if ($(e.target).attr("aria-controls") === "results") {
			$("#section-menu .list-group-item").removeClass("active");
		}
	
		if ($(e.target).attr("aria-controls") === "charts") {
			$("#section-menu .list-group-item").removeClass("active");
		}
	});
}

function check_offline(is_online) {
	if (is_online)
		$("#offline-error-message").hide();
	else 
		$("#offline-error-message").show();
}

function check_config_settings() {
	var is_configured = false;
	var temp = store.get('config.r_executable_path');
	if (temp.length > 0) {
		is_configured = true;
	}
	
	if (!is_configured) {
		$("#config-error-message").show();
		//search_for_rscript();
	} else {
		$("#config-error-message").hide();
	}

	// var entry_mode = store.get('config.entry_mode');
	// if (entry_mode.length == 0) {
	// 	store.set('config.entry_mode', 'basic');
	// }
}

function show_screen(id) {
	$(".screen").hide();

	if (id.includes('#'))
		$(id).show();
	else
		$('#' + id).show();
}

function show_welcome_screen() {
	show_screen('welcome-screen');
	check_config_settings();
	check_offline(true);
}

function init_case_screen() {
	$("#case_number_input").val("");
	$("#designation_input").val("");
	$("#recorder_input").val("");
	$("#date_input").val("");
	$("#notes_input").val("");
	$("#current_file_name").text("(untitled.ta3)");
	$("#current_file_status").text("");
}

function show_case_screen() {
	$('#main-tabs a[href="#evaluation"]').tab('show');

	$('#main-tabs a[href="#results"]').hide();
	$('#main-tabs a[href="#charts"]').hide();

	$("#welcome-screen").hide();
	$("#case-screen").show();

	populate_section_menu();
	$("#evaluation-content-empty").show();
	$("#evaluation-content").hide();
}

function display_entry_mode(mode) {
	if (mode === "" || mode === undefined) {
		mode = store.get('config.entry_mode');
	}
	$(".entry-mode").hide();
	$("#trait-score-" + mode).show();

	populate_entry_mode();
}

function populate_section_menu() {
	var sections = data_get_sections();

	var sectionList = $("#section-menu");
	sectionList.empty();

	var listGroup = $("<div></div");
	listGroup.addClass("list-group");
	for (var i = 0; i < sections.length; i++) {
		var section_id = i;
		var listItem = $("<a></a>")
			.addClass("list-group-item")
			.attr("href", "#")
			.data("section-id", section_id)
			.html(sections[i].name);
		listGroup.append(listItem);
	}

	sectionList.append(listGroup);
}

function select_section(obj) {
	var section_idx = $(obj).data("section-id");
	var section = data_get_section(section_idx);
	var section_text = section.abbreviation;

	current_traits = section.traits;
	current_trait_idx = 0;
	current_trait_text = "";
	current_section_idx = section_idx;
	current_section_text = section_text;

	$("#section-menu .list-group-item").removeClass("active");
	$(obj).addClass("active");
	$("#trait-pager .previous").addClass("disabled");
	
	display_entry_mode();

	$("#evaluation-content-empty").hide();
	$("#evaluation-content").show();
}

function populate_entry_mode() {
	var mode = store.get('config.entry_mode');

	if (mode === "basic") {
		if (current_traits != null) {
			update_pager_buttons();
			var trait = current_traits[current_trait_idx];
			populate_trait_prompt(trait);
		}
	}

	if (mode === "advanced") {
		hide_pager_buttons();
		//populate_advanced_mode(current_section_idx);
		populate_advanced_mode(current_section_text);
	}

	if (mode === "expert") {
		hide_pager_buttons();
		// populate_expert_mode(current_section_idx);
		populate_expert_mode(current_section_text);
	}
}

function populate_expert_mode(section) {}

function populate_advanced_mode(section) {
	$("#advanced-mode-list").empty();

	var data = data_get_section_text(section);

	var cols = data["columns"];
	var num_cols = cols.length;
	
	// HEADER ROW
	var header_row = $("<div></div>");
	header_row.addClass("row").addClass("adv-row").addClass("adv-row-header");
	var width = num_cols == 2 ? 4 : 6;
	var col_width = "col-xs-" + width;
	
	header_row.append($("<div></div>").addClass(col_width).text(data["name"]));

	for (var i = 0; i < cols.length; i++) {
		header_row.append($("<div></div>").addClass("col-xs-" + width).text(cols[i]["text"]));
	}
	$("#advanced-mode-list").append(header_row);


	// TRAIT ROWS
	if (cols != undefined && cols.length > 0) {
		var num_rows = cols[0].traits.length;
		for (var i = 0; i < num_rows; i++) {
			var row = $("<div></div>");
			row.addClass("row").addClass("adv-row");

			var col_name = current_traits.filter(function(d) {
				return d.db_name === cols[0].traits[i];
			})[0].generic_title;

			row.append($("<div></div>").addClass(col_width).text(col_name));

			for (var j = 0; j < num_cols; j++) {
				//console.log("searching for: ", i, j, cols[j].traits[i]);
				if (cols[j].traits[i] != null) {
					var trait = current_traits.filter(function(d) {
						return d.db_name === cols[j].traits[i];
					})[0];
					//console.log(trait);

					if (trait != undefined) {
						var trait_col = $("<div></div>").addClass(col_width);
// 						<div class="btn-group" role="group" aria-label="...">
//   <button type="button" class="btn btn-default">Left</button>
//   <button type="button" class="btn btn-default">Middle</button>
//   <button type="button" class="btn btn-default">Right</button>
// </div>
						var group = $("<div></div>");
						group.addClass("btn-group")
							.attr("role", "group")
							.attr("aria-label", "Trait scores for " + trait.title)
							.attr("data-trait-text", trait.db_name);

						for (var k = 0; k < trait.scores.length; k++) {
							var btn = $("<button></button>");
							btn.attr("type", "button")
								.addClass("btn")
								.addClass("btn-default")
								.addClass("adv-radio")
								.text(trait.scores[k].abbreviation)
								.attr("data-section-text", current_section_text)
								.attr("data-trait-text", trait.db_name)
								.attr("data-score-text", trait.scores[k].value)
								.data("identifier", String(current_section_text) + "-" + String(trait.db_name) + "-" + String(trait.scores[k].value));

							// var input = $("<input></input");
							// input.attr("type", "radio")
							// 	.addClass("adv-radio")
							// 	.attr("id", "adv-trait-" + i.toString() + "-" + j.toString() + "-" + k.toString())
							// 	.attr("name", "adv-trait-" + i.toString() + "-" + j.toString())
							// 	.attr("value", trait.scores[k].value)
							// 	.attr("data-section-text", current_section_text)
							// 	.attr("data-trait-text", trait.db_name)
							// 	.attr("data-score-text", trait.scores[k].value);

							var idx = find_item_in_selections_text(current_section_text, trait.db_name, trait.scores[k].value);
							var is_selected = (idx > -1);
							if (is_selected) {
								//input.attr("checked", "checked");
								btn.addClass("active");
							}
							
							// var label = $("<label></label>");
							// label.attr("for", "adv-trait-" + i.toString() + "-" + j.toString() + "-" + k.toString())
							// 	.html(trait.scores[k].abbreviation);

							// trait_col.append(input).append(" ").append(label);
							group.append(btn);
						}
						trait_col.append(group);
						row.append(trait_col);
					}
				} else {
					row.append($("<div></div>").addClass(col_width).text(""));
				}
			}

			$("#advanced-mode-list").append(row);
		}
	}

	// for (var i = 0; i < current_traits.length; i++) {
	// 	var row = $("#advanced-mode-template").clone();
	// 	row.removeAttr("id");
	// 	row.find(".adv-trait-name").html(current_traits[i].title);

	// 	for (var j = 0; j < 4; j++) {
	// 		if (current_traits[i].scores[j] !== undefined) {
	// 			var input = row.find(".adv-radio-" + j.toString());
	// 			var label = row.find(".adv-label-" + j.toString());

	// 			input.attr("id", "adv-trait-" + i.toString() + "-" + j.toString());
	// 			input.attr("name", "adv-trait-" + i.toString());
	// 			input.attr("value", current_traits[i].scores[j].value);
	// 			input.attr("data-section-idx", current_section_idx);
	// 			input.attr("data-section-text", current_section_text);
	// 			input.attr("data-trait-idx", i);
	// 			input.attr("data-trait-text", current_traits[i].db_name);
	// 			input.attr("data-score-idx", j);
	// 			input.attr("data-score-text", current_traits[i].scores[j].value);

	// 			//var idx = find_item_in_selections(current_section_idx, i, j);
	// 			var idx = find_item_in_selections_text(current_section_text, current_traits[i].db_name, current_traits[i].scores[j].value);
	// 			var is_selected = (idx > -1);
	// 			if (is_selected) {
	// 				input.attr("checked", "checked");
	// 			}

	// 			label.attr("for", "adv-trait-" + i.toString() + "-" + j.toString());
	// 			label.html(current_traits[i].scores[j].abbreviation);
	// 		} else {
	// 			row.find(".adv-col-" + j.toString()).remove();
	// 		}
	// 	}

	// 	row.removeClass("template");
	// 	$("#advanced-mode-list").append(row);
	// }
}

function populate_trait_prompt(trait) {
	$("#trait-content #trait-title").html(trait.title);
	
	if (trait.description.length > 0) {
		$("#trait-content #trait-description").show();
		$("#trait-content #trait-description").html(trait.description);
	} else {
		$("#trait-content #trait-description").hide();
	}
	
	$("#trait-content #trait-images").empty();
	if (trait.images.length > 0) {
		$.each(trait.images, function(k, v) {
			var img = $("<img></img>");
			img.attr("src", v.path)
				.attr("alt", v.caption)
				.addClass("img-responsive")
				.addClass("trait-thumbnail")
				.attr("height", 100)
				.attr("width", 100);
			
			$("#trait-content #trait-images").append(img);
		});
	} else {
		$("#trait-content #trait-images").hide();
	}

	//TODO: figure out how to handle show/hide of these
	$("#trait-content #trait-location").hide();
	$("#trait-content #trait-notes").hide();

	if (trait.scores.length > 0) {
		var div = $("#trait-scores");
		div.empty();

		for (var i = 0; i < trait.scores.length; i++) {
			var size = 12;
			switch (trait.scores.length) {
				case 2:
					size = 6;
					break;
				case 3:
					size = 4;
					break;
				case 4:
					size = 3;
					break;
				case 5:
					size = 25;
					break;
				case 6:
					size = 4;
					break;
			}
			
			var col = $("<div></div>");
			col.addClass("col-xs-" + size)
				.addClass("answer-col")
				.addClass("text-center");

			//check if item was already selected or not
			// var idx = find_item_in_selections(current_section_idx, current_trait_idx, i);
			var idx = find_item_in_selections_text(current_section_text, current_trait_text, trait.scores[i].value);
			var is_selected = (idx > -1);
			if (is_selected) {
				col.addClass("selected");
			}

			var scoreNode = $("#trait-score-template").clone();
			// scoreNode.removeAttr("id")
			// 		.removeAttr("style")
			// 		.removeClass("template")
			// 		.addClass("trait-score")
			// 		.data("identifier", String(current_section_idx) + "-" + String(current_trait_idx) + "-" + String(i));
			scoreNode.removeAttr("id")
					.removeAttr("style")
					.removeClass("template")
					.addClass("trait-score")
					.data("identifier", String(current_section_text) + "-" + String(trait.db_name) + "-" + String(i));

			/**** TITLE, DESCRIPTION, and IMAGES ****/
			scoreNode.find('.trait-score-title').html
			(trait.scores[i].title);
			//$(scoreNode).find('.trait-score-description').attr("title", trait.scores[i].description);

			/**** SCORE SELECTION BUTTON ****/
			var btn = scoreNode.find(".trait-score-button");
			btn.attr("data-section-idx", current_section_idx);
			btn.attr("data-trait-idx", current_trait_idx);
			btn.attr("data-score-idx", i);
			btn.attr("data-section-text", current_section_text);
			btn.attr("data-trait-text", trait.db_name);
			btn.attr("data-score-text", trait.scores[i].value);
			if (is_selected) {
				btn.removeClass("btn-success")
					.addClass("btn-warning")
					.text("Deselect");
			}

			/**** SCORE IMAGES  ****/
			var carousel = scoreNode.find("#trait-score-carousel");
			if (trait.scores[i].images.length > 0) {
				carousel.removeAttr("id").attr("id", "carousel-" + i);
				carousel.find(".carousel-inner").empty();

				//remove carousel arrows if only one image
				if (trait.scores[i].images.length === 1) {
					carousel.find(".left").hide();
					carousel.find(".right").hide();
				} else {
					carousel.find(".left").attr("href", "#carousel-" + i);
					carousel.find(".right").attr("href", "#carousel-" + i);
				}

				for (var j = 0; j < trait.scores[i].images.length; j++) {
					var slide = $("<div></div>");
					slide.addClass("item");
					if (j == 0) { slide.addClass("active"); }

					var img = $("<img></img>");
					img.addClass("img-responsive");
					img.attr("src", trait.scores[i].images[j].path);
					img.attr("alt", trait.scores[i].images[j].title + " " + trait.scores[i].images[j].caption);

					var caption = $("<div></div>");
					caption.html("<h5>" + trait.scores[i].images[j].title + "</h5><p class=\"small\">" + trait.scores[i].images[j].caption + "</p>");

					slide.append(img).append(caption);
					carousel.find(".carousel-inner").append(slide);
				}
			} else {
				carousel.hide();
				scoreNode.append($("<p>No images available.</p>"));
			}
	
			col.append(scoreNode);
			div.append(col);
		}
	}
}

function hide_pager_buttons() {
	$("#trait-pager .previous").hide();
	$("#trait-pager .next").hide();
}

function update_pager_buttons() {
	$("#trait-pager .previous").show();
	$("#trait-pager .next").show();
	
	if (current_trait_idx === 0) {
		$("#trait-pager .previous").addClass("disabled");
	} else {
		$("#trait-pager .previous").removeClass("disabled");
	}

	if (current_trait_idx === current_traits.length-1) {
		$("#trait-pager .next").addClass("disabled");
	} else {
		$("#trait-pager .next").removeClass("disabled");
	}
}






function toggle_score_selection(section_idx, trait_idx, score_idx) {
	var selection = {
		"section": section_idx, 
		"trait": trait_idx,
		"score": score_idx
	};

	var idx = find_item_in_selections(
		selection.section, 
		selection.trait, 
		selection.score
	);

	//if already in there, just remove it
	// otherwise, swap section/trait with this
	if (idx > -1) {
		selections.splice(idx, 1);
	} else {
		//remove anything with same section and trait idx
		for (var i = 0; i < selections.length; i++) {
			if (String(selections[i].section) === String(section_idx) && 
				String(selections[i].trait) === String(trait_idx)) {
					selections.splice(i, 1);
				}
		}
		
		selections.push(selection);
	}

	window.is_dirty = true;
	update_file_status();
	
	//console.log(selections);
}

function toggle_score_selection_text(section, trait, score) {
	var selection = {
		"section": section,
		"trait": trait,
		"score": score
	};

	var idx = find_item_in_selections_text(section, trait, score);
	if (idx > -1) {
		selections.splice(idx, 1);
	} else {
		for (var i = 0; i < selections.length; i++) {
			if (selections[i].section === section && 
				selections[i].trait === trait) {
					selections.splice(i, 1);
				}
		}
		selections.push(selection);
	}

	window.is_dirty = true;
	update_file_status();
	//console.log(selections);
}

function find_item_in_selections(section_idx, trait_idx, score_idx) {
	for (var i = 0; i < selections.length; i++) {
		if (String(selections[i].section) === String(section_idx) && 
			String(selections[i].trait) === String(trait_idx) && 
			String(selections[i].score) === String(score_idx)) {
				return i;
			}
	}
	return -1;
}

function find_item_in_selections_text(section, trait, score) {
	for (var i = 0; i < selections.length; i++) {
		if (selections[i].section === section && 
			selections[i].trait === trait && 
			selections[i].score === score) {
				return i;
			}
	}
	return -1;
}

function show_current_selections() {
	$("#current-selections").empty();

	if (selections.length > 0) {
		$("#selections button").removeAttr("disabled");

		selections.sort(function(a, b) {
			return Number(a.section) - Number(b.section);
		});

		var table = $("#selections-template").clone();
		table.removeAttr("id")
			.removeClass("template")
			.removeAttr("style");
		var table_body = table.find("tbody");
		table_body.empty();

		var current_s = -1;
		for(var i = 0; i < selections.length; i++) {
			var s = data_get_section(selections[i].section);
			var t = data_get_trait(selections[i].section, selections[i].trait);
			var sc = data_get_trait_score(selections[i].section, selections[i].trait, selections[i].score);

			var row = $("<tr></tr>");
			row.append($("<td></td>").html(s.name));
			row.append($("<td></td>").html(t.title));
			row.append($("<td></td>").html(sc.title));
			table_body.append(row);
		}

		$("#current-selections").append(table);
	} else {
		$("#selections button").attr("disabled", "disabled");
	}
	console.log(selections);
}

function show_current_selections_text() {
	$("#current-selections").empty();

	if (selections.length > 0) {
		$("#selections button").removeAttr("disabled");

		selections.sort(function(a, b) {
			return ('' + a.section).localeCompare(b.section);
		});

		var table = $("#selections-template").clone();
		table.removeAttr("id")
			.removeClass("template")
			.removeAttr("style");
		var table_body = table.find("tbody");
		table_body.empty();

		var current_s = -1;
		for(var i = 0; i < selections.length; i++) {
			var s = data_get_section_text(selections[i].section);
			var t = data_get_trait_text(selections[i].section, selections[i].trait);
			var sc = data_get_trait_score_text(selections[i].section, selections[i].trait, selections[i].score);

			var row = $("<tr></tr>");
			row.append($("<td></td>").html(s.name));
			row.append($("<td></td>").html(t.title));
			row.append($("<td></td>").html(sc.title));
			table_body.append(row);
		}

		$("#current-selections").append(table);
	} else {
		$("#selections button").attr("disabled", "disabled");
	}
	//console.log(selections);
}



function generate_csv_file() {
	//var filename = generate_random_id(10) + '.csv';
	var filename = "TA3_Input.csv";
	
	//loop through selections and create file and save to disk
	var output = '';
	var header = '';

	var sections = data_get_sections();
	for (var i = 0; i < sections.length; i++) {
		var traits = sections[i].traits;
		for (var j = 0; j < traits.length; j++) {
			header += traits[j].db_name + ',';
			
			var is_trait_entered = false;
			var trait_entered_idx = -1;
			var scores = traits[j].scores;
			for (var k = 0; k < scores.length; k++) {
				//var idx = find_item_in_selections(i, j, k);
				var idx = find_item_in_selections_text(sections[i].abbreviation, traits[j].db_name, scores[k].value);
				if (idx > -1) {
					is_trait_entered = true;
					trait_entered_idx = k;
					break;
				}
			}

			if (is_trait_entered) {
				output += scores[trait_entered_idx].value + ',';
			} else {
				output += 'NA,';
			}
		}
	}

	if (output.length > 0) {
		output = output.substring(0, output.length-1);
	}
	if (header.length > 0) {
		header = header.substring(0, header.length-1);
	}

	try {
		var fullPath = path.join(store.get('config.analysis_path'), filename);
		//console.log(fullPath);
		fs.writeFileSync(fullPath, header + '\n' + output + '\n');
		return filename;
	} catch(err) { 
		console.error(err);
		return "";
	}
}

function run_analysis() {
	//TODO: disable buttons and tab switching while running?

	//var app_working_dir = __dirname.replace(/\\/g, "\\\\");
	var temp_dir = store.get('config.analysis_path');
	var scripts_dir = store.get('config.r_path');
	var data_file = generate_csv_file();

	var loadingDiv = $("#result-loading");
	var outputDiv = $("#result-output");
	var imageDiv = $("#result-images");
	var resultStatus = $("#result-status");
	var resultDebug = $("#result-debug");

	outputDiv.empty();
	imageDiv.empty();
	resultStatus.empty();
	resultDebug.empty();

	if (data_file.length > 0) {
		loadingDiv.show();
		
		var parameters = [
			path.join(scripts_dir, "ta3.R"), 
			temp_dir,
			scripts_dir];

		var resultPending = $("<div></div>");
		resultPending.addClass("alert alert-info")
			.attr("role", "alert")
			.html("The analysis script is currently running. This process can take upwards of 5 minutes.");
		resultStatus.empty().append(resultPending);


		var debugStatusHtml = "<strong>Executable: </strong>" + store.get('config.r_executable_path') + "<br /><strong>Parameters: </strong><br /><ul>";

		for (var i = 0; i < parameters.length; i++) {
			debugStatusHtml += "<li>" + parameters[i] + "</li>";
		}
		debugStatusHtml += "</ul>";

		resultDebug.empty().append(
			$("<div></div>")
				.addClass("alert alert-warning")
				.attr("role", "alert")
				.html(debugStatusHtml)
		);

		//clean_temp_files();

		var options = {
			name: 'TA3 Subprocess'
		};
		var cmd = '"' + store.get('config.r_executable_path') + '"';
		$.each(parameters, function(i,v) {
			cmd = cmd + ' "' + v + '"';
		});

		sudo.exec(cmd, options, 
			function(error, stdout, stderr) {
				if (error) {
					var resultError = $("<div></div>");
					resultError.addClass("alert alert-danger")
						.attr("role", "alert")
						.html("<p><strong>There was an error executing the analysis script:</strong></p><p>" + error + "</p>");
					resultStatus.empty().append(resultError);
					return;
				}

				//display output text in Results tab
				var outputDiv = $("#result-output");
				var code = $("<pre></pre>");
				code.append(stdout.toString());
				outputDiv.append(code);

				//TODO: read from userdata_dir/output.txt and display

				//display output images in Charts tab
				//console.log("loading plot: " + "file://" + path.join(temp_dir, "output1.png"));
				
				show_output_image(path.join(temp_dir, "output1.png"), imageDiv);
				resultStatus.empty();
				//resultDebug.empty();
				
				loadingDiv.hide();

				//show charts tab only when full analysis is completed
				$('#main-tabs a[href="#charts"]').show();
			}
		);
	} else {
		var resultError = $("<div></div>");
		resultError.addClass("alert alert-danger")
			.attr("role", "alert")
			.html("There was an error while generating the data file for analysis.");
		resultStatus.empty().append(resultError);
	}
}

function show_output_image(filename, parent) {
	if (fs.existsSync(filename)) {
		var img = $("<img></img>");
		img.attr("src", "file://" + filename + "?rand=" + (Math.random() * 99999999))
			.addClass("img-responsive");
		parent.append(img);
	}
}





function show_suggested_rscript_paths() {
	var span = $("#settings-found-rscript");
	span.empty().html('<p class="loading">Loading suggested paths...</p>');

	if (process.platform === "win32" || process.platform === "win64") {
		search_for_rscript('C:\\Program Files\\R');
		search_for_rscript('C:\\Program Files\\Microsoft\\R Open');
	}

	if (process.platform === "darwin") {
		search_for_rscript('/usr/bin/Rscript');
        search_for_rscript('/Library/Frameworks/R.framework/Resources/bin');
        search_for_rscript("/Library/Frameworks/R.framework/Versions/3.5.1-MRO/Resources/bin/");
	}
	
	span.find("p.loading").remove();
}

function search_for_rscript(path) {
	var span = $("#settings-found-rscript");
    find.file(/Rscript.exe/, path, function(files) {
		if (files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				span.append(
					$("<a></a>")
						.addClass("rscript-settings-link")
						.text(files[i])
				).append($("<br></br>"));
			}
		}
	})
    .error(function(err) { console.error(err); });
}




function new_case() {
	window.is_dirty = false;
	window.current_file = "";
	current_traits = null;
	current_trait_idx = -1;
	current_section_idx = -1;
	current_section_text = "";
	current_trait_text = "";
	selections = [];

	init_case_screen();
	show_case_screen();
	update_file_status();

	// init results screen

	show_screen('case-screen');
	// check settings for which view to show
}

function open_case() {
	dialog.showOpenDialog({
		properties: ['openfile'],
		title: 'Open TA3 Case File',
		buttonLabel: 'Open TA3 File',
		filters: [
			{name: 'TA3 Analysis', extensions: ['ta3']}
		]
	}, function(files) {
		if (files != undefined) {
			if (files.length == 1) {
				new_case();
				var filePath = files[0];

				fs.readFile(filePath, 'utf8', (err, data) => {
					if (err) console.error(err);

					var json = JSON.parse(data);

					// TODO: do work
					$("#case_number_input").val(json['properties']['case_number']);
					$("#designation_input").val(json['properties']['designation']);
					$("#recorder_input").val(json['properties']['recorder']);
					$("#date_input").val(json['properties']['observation_date']);
					$("#notes_input").val(json['properties']['notes']);
					selections = json['traits'];

					window.current_file = filePath;

					//show_current_selections();
					$('#main-tabs a[href="#selections"]').tab('show');
					$('#main-tabs a[href="#selections"]').show();

					update_file_status();
				});
			}
		}
	});
}

function save_case() {
	// TODO: add results to file and encode for json
	var output = '{"traits":' + JSON.stringify(selections) + ',';
	output += '"properties":{"case_number":' + JSON.stringify($("#case_number_input").val()) + ',';
	output += '"designation":' + JSON.stringify($("#designation_input").val()) + ',';
	output += '"recorder":' + JSON.stringify($("#recorder_input").val()) + ',';
	output += '"observation_date":' + JSON.stringify($("#date_input").val()) + ',';
	output += '"notes":' + JSON.stringify($("#notes_input").val()) + '}';
	// output += '"results":{"ancenstry":"' + JSON.stringify($("#analysis-results-1").html()) + '",';
	// output += '"probabilities":"' + JSON.stringify($("#analysis-results-2").html()) + '",';
	// output += '"matrix":"' + JSON.stringify($("#analysis-results-3").html()) + '"}';
	output += '}';

	console.log(output);

	if (window.current_file == "") {
		var options = {
			title: 'Save TA3 Case File',
			buttonLabel: 'Save TA3 File',
			filters: [
				{name: 'TA3 Analysis', extensions: ['ta3']}
			]
		};
		dialog.showSaveDialog(null, options, (p) => {
			console.log(p);
			fs.writeFile(p, output, function(err) {
				if (err) console.error(err);

				console.log("File Saved");
				window.current_file = p;
				window.is_dirty = false;
				update_file_status();
			});
		});
	} else {
		fs.writeFile(window.current_file, output, function(err) {
			if (err) console.error(err);

			console.log("File Saved");
			window.is_dirty = false;
			update_file_status();
		});
	}
}

function update_file_status() {
	if (window.current_file == "") {
		$("#current_file_name").text("(untitled.ta3)");
		$("#current_file_status").text("");	
	} else {
		$("#current_file_name").text("(" + path.basename(window.current_file) + ")");
		if (window.is_dirty)
			$("#current_file_status").text("*");	
		else
			$("#current_file_status").text("");	
	}
}







function verify_package_install(pkg, template) {
	var analysis_path = store.get("analysis_path");
	var r_script = path.join(analysis_path, "verify_package.R");
	var parameters = [
		r_script,
		pkg
	];

	var options = {
		name: 'TA3 Subprocess'
	};
	var cmd = '"' + store.get("config.r_executable_path") + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});

	sudo.exec(cmd, options, 
		function(error, stdout, stderr) {
			if (error) {
				console.error(error);
				console.error(stderr);
				return false;
			}
			var output = JSON.stringify(stdout);
			console.log("verify stdout: " + output);
			toggle_package_status(pkg, template, output.includes("TRUE"));
		}
	);
}

function install_package(pkg, template) {
	var analysis_path = store.get("analysis_path");
	var r_script = path.join(analysis_path, "install_package.R");
	var parameters = [
		r_script,
		pkg
	];

	var options = {
		name: 'TA3 Subprocess'
	};
	var cmd = '"' + store.get("config.r_executable_path") + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});

	sudo.exec(cmd, options, 
		function(error, stdout, stderr) {
			if (error) {
				console.error(error);
				console.log(stderr);
				toggle_package_status(pkg, template, false); 
				return false;
			}
			console.log('stdout: ' + JSON.stringify(stdout));
			console.log('stderr: ' + JSON.stringify(stderr));
			toggle_package_status(pkg, template, true);
			return true;
		}
	);
}






ipcRenderer.on('new-case', (event, arg) => {
	new_case();
});
ipcRenderer.on('open-case', (event, arg) => {
	open_case();
});
ipcRenderer.on('save-case', (event, arg) => {
	save_case();
});
ipcRenderer.on('settings', (event, arg) => {
	$('#settings-modal').modal('show');
});
ipcRenderer.on('show-case-info', (event, arg) => {
	$('#main-tabs a[href="#caseinfo"]').tab('show');
});
ipcRenderer.on('show-selections', (event, arg) => {
	$('#main-tabs a[href="#selections"]').tab('show');
});
ipcRenderer.on('show-results', (event, arg) => {
	if ($('#main-tabs a[href="#results"]').is(":visible")) {
		$('#main-tabs a[href="#results"]').tab('show');
	} else {
		$('#main-tabs a[href="#selections"]').tab('show');
	}
});
ipcRenderer.on('verify-r-settings', (event, arg) => {
	console.error("NOT IMPLEMENTED");
});
ipcRenderer.on('run-analysis', (event, arg) => {
	$('#main-tabs a[href="#results"]').tab('show');
	$('#main-tabs a[href="#results"]').show();
	run_analysis();
});









function data_get_sections() {
	return window.appdb;
}

function data_get_section(section_idx) {
	return window.appdb[section_idx];
}

function data_get_section_text(section) {
	return window.appdb.filter(
		function (data) { return data.abbreviation == section; }
	)[0];
}

function data_get_traits(section_idx) {
	return window.appdb[section_idx].traits;
}

function data_get_trait(section_idx, trait_idx) {
	return window.appdb[section_idx].traits[trait_idx];
}

function data_get_trait_text(section, trait) {
	var d = data_get_section_text(section);
	return d['traits'].filter(
		function (data) { return data.db_name == trait; }
	)[0];
}

function data_get_trait_scores(section_idx, trait_idx) {
	return window.appdb[section_idx].traits[trait_idx].scores;
}

function data_get_trait_score(section_idx, trait_idx, score_idx) {
	return window.appdb[section_idx].traits[trait_idx].scores[score_idx];
}

function data_get_trait_score_text(section, trait, score) {
	var d = data_get_trait_text(section, trait);
	// console.log(d, section, trait, score);
	// console.log(d[0]['scores']);
	return d['scores'].filter(
		function (data) { return data.value == score; }
	)[0];
}

function data_get_indexes_by_trait_db_name(trait, value) {
	//console.log("SEARCHING FOR: " + trait);
	for (var i = 0; i < window.appdb.length; i++) {
		//console.log("  " + appdb[i].name);
		for (var j = 0; j < window.appdb[i]['traits'].length; j++) {
			var t = window.appdb[i]['traits'][j];
			if (t['db_name'] === trait) {
				//console.log("    found trait, getting score");
				for (var k = 0; k < t['scores'].length; k++) {
					var s = t['scores'][k];
					if (s['value'] === value) {
						//console.log("FOUND:" + i + "/" + j + "/" + k);
						return [i, j, k];
					}
				}
			}
		}
	}
	return [-1, -1, -1];
}