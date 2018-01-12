var WORKFLOW = ["YOUR","WORKFLOW","HERE"];

var host = "http://localhost:6970";


function initGraph() {
	var cycleDataSettings = {
	  "async": true,
	  "crossDomain": true,
	  "url": host+"/three-pt-data/cycle",
	  "method": "GET"
	}

	$.ajax(cycleDataSettings).done((cycleData) => {
		var workflowCycleData = cycleData.filter((data) => data.points === -1)
										 .filter((data) => WORKFLOW.indexOf(data.phase) > -1)
										 .sort((a,b) => WORKFLOW.indexOf(a.phase) - WORKFLOW.indexOf(b.phase));

		 var e = {
			x : workflowCycleData.map((phase) => phase.phase),
			y : workflowCycleData.map((phase) => (phase.weightedaverage / 3600000)/24),
			name : 'E',
			type: 'bar',
			marker: {
				color: 'green'
			}
		};

		var sd1 = {
			x : workflowCycleData.map((phase) => phase.phase),
			y : workflowCycleData.map((phase) => (phase.sd / 3600000)/24),
			name : 'sd1',
			type: 'bar',
			marker: {
				color: 'yellow'
			}
		};

		var sd2 = {
			x : workflowCycleData.map((phase) => phase.phase),
			y : workflowCycleData.map((phase) => (phase.sd / 3600000)/24),
			name : 'sd2',
			type: 'bar',
			marker: {
				color: 'red'
			}
		};

		var data = [e,sd1,sd2];

		var layout = {
			title : "Active Sprint Ageing Chart",
			showlegend : false,
			barmode: 'stack',
			xaxis: {
				title : 'Phases'
			},
			yaxis: {
				title : 'Time in Days'
			}
		};

		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": host+"/sprint/tasks?expand=true",
		  "method": "GET"
		}

		var cb = (data, layout, response) => {
			var transformedResponse = response.issues.filter((_i) => _i.fields.issuetype.name !== "Epic")
																 .filter((_i) => _i.changelog.histories.filter((_c) => _c.items[0].field === 'status'))
																 .map((_i) => {
																 	return { 
																 		key : _i.key, 
																 		sp : _i.fields.customfield_10002, 
																 		status : _i.fields.status,
																 		changelog : _i.changelog.histories.filter((_c) => _c.items[0].field === 'status')
																 	}
															 	  }).filter((_i) => _i.status.statusCategory.key === "indeterminate").map((_i) => {
															 	  	return {
															 	  		key : _i.key,
															 	  		sp : _i.sp,
															 	  		status : _i.changelog.map((_c) => {
															 	  			return {
															 	  				happened : _c.created,
															 	  				timeElapsed : ((Date.now() - new Date(_c.created).getTime())/3600000)/24,
															 	  				name : _c.items[0].toString
															 	  			}
															 	  		})
															 	  		// we need to get the latest transition. if a task has been In Progress 10 years ago, and has been put to Open again
															 	  		// then we want to take the one happening now.
															 	  		.sort((a,b) => new Date(b.happened) - new Date(a.happened))
															 	  		  .find((_c) => {
															 	  			return (_c.name === _i.status.name)
															 	  		})
															 	  	}
															 	  }).filter((_i) => _i.status);

		 	 var scatterData = {
		 	 	x : transformedResponse.map((_i) => _i.status.name),
		 	 	y : transformedResponse.map((_i) => _i.status.timeElapsed),
		 	 	mode : 'markers+text',
		 	 	textposition : 'top right',
		 	 	textfont : {
		 	 		size : 10,
		 	 		color : 'black'
		 	 	},
		 	 	type : 'scatter',
		 	 	name : 'Stories',
		 	 	text : transformedResponse.map((_i) => _i.sp ? _i.key + ' (' + _i.sp + ' Story Points)' : _i.key),
		 	 	marker : {
		 	 		size : 12,
		 	 		color : 'black'
		 	 	}
		 	 }

		 	data.push(scatterData);
			Plotly.newPlot(document.getElementById("chart"), data, layout);
		}

		$.ajax(settings).done(cb.bind(this,data, layout));
	});





}

document.addEventListener('DOMContentLoaded', function() { 
	initGraph();
});