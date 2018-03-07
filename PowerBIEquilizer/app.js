/*============================================================================
#	File: app.js
#
#	Summary: This JScript analyzes the mp3 File given in 'audioElement' and
#            will create a JSon File with all the values in it and stream it
#            to the Power BI Service
#
#	Date: 2018-03-07
#
#------------------------------------------------------------------------------
#	Written by Frank Geisler, GDS Business Intelligence GmbH
#
#	This script is intended only for educational purposes
#
#	THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF 
#	ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED 
#	TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/ OR FITNESS FOR A
#	PARTICULAR PURPOSE.
#============================================================================*/

$(document).ready(function () {

    // FGE: Create AudioContext
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // FGE: Create AudioElement and load from HTML
    var audioElement = document.getElementById('audioElement');
    // FGE: Create Audio Source from Audio Context
    var audioSrc = audioCtx.createMediaElementSource(audioElement);
    // FGE: Create Analyzer from Audio Context
    var analyser = audioCtx.createAnalyser();

    // FGE: Bind analyser to the media element source.
    audioSrc.connect(analyser);
    audioSrc.connect(audioCtx.destination);

    // FGE: Array that will hold the frequencyData
    var frequencyData = new Uint8Array(200);

    // FGE: This is a function that stops execution for a given time
    //      we need it for reducing the data that is sent to Power BI
    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }

    // FGE: To reduce the data that will be sent to PowerBI we create
    //      buckets. Each bucket stands for a number of fequency values
    //      that will be summed up in the bucket
    var bucketsize = 20; 
    // FGE: Number of steps is calculated - it is defining how often the
    //      sum should be aggregated for the whole dataset
    var number_of_steps = 200 / bucketsize;

    // FGE: Continuously loop and create JSON with frequency data.
    function streamData() {

        // FGE: Copy frequency data to frequencyData array.
        analyser.getByteFrequencyData(frequencyData);

        // FGE: Create a JSON file for streaming from the frequency data
        powerbi_dataset = "["

        for (var j = 0; j < number_of_steps; j++)
        {
            var start_number = j * bucketsize;
            var end_number = (j+1) * bucketsize;

            var sum = 0;
            for (var s = start_number; s < end_number; s++) {
                sum += frequencyData[s]; 
            }

            var avg = sum / bucketsize;
            powerbi_dataset = powerbi_dataset + "{\"Frequenz\" :\"" + j + "\", \"Wert\" :" + sum + "},";
            
        }

        // FGE: Kill the last comma
        powerbi_dataset = powerbi_dataset.slice(0, -1);
        powerbi_dataset = powerbi_dataset + "]";

        // FGE: Log the Json File to the debug console
        console.log(powerbi_dataset);

        // FGE: Post Data to Power BI Service
        jQuery.ajax({
            type: "POST",
            // FGE: Here you have to paste your URL from Power BI
            url: "https://api.powerbi.com/<yourKey>",
            cache: false,
            data: powerbi_dataset,
            dataType: "json",
            contentType: "json"
        });

        // FGE: Wait for half a second
        sleep(500); 

       // FGE: Used to update browser window 
       requestAnimationFrame(streamData);
    }

    // Run the loop
    streamData();

});