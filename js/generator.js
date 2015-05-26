'use strict';

$(document).ready(function() {

  // Global vars
  var barLooper = null;
  var bars = [];

  var USER_SETTINGS_KEY = 'USER_SETTINGS';
  var SAVED_BEATS_KEY   = 'SAVED_BEATS';

  // Get the initial user default settings
  var userDefaults = store.get(USER_SETTINGS_KEY);
  if (!userDefaults) userDefaults = {};

  // Get the initial saved beats
  var savedBeats = store.get(SAVED_BEATS_KEY);
  if (!savedBeats) savedBeats = [];

  /**
   * Updates userDefaults for the key and value given.
   */
  var updateUserDefault = function(key, value) {
    userDefaults[key] = value;
    store.set(USER_SETTINGS_KEY, userDefaults);
  };

  /**
   * Saves the current beat to localStorage.
   */
  var saveCurrentBeat = function() {
    var savedBeat = {
      bars: bars,
      options: options
    };
    savedBeats.push(savedBeat);
    store.set(SAVED_BEATS_KEY, savedBeats);
    renderSavedBeats();
  };

  var removeBeatAtIndex = function(index) {
    savedBeats.splice(index, 1);
    store.set(SAVED_BEATS_KEY, savedBeats);
    renderSavedBeats();
  };

  // Options
  var options = _.defaults({}, userDefaults, {
    beatVariations: ['tomtom', 'floortom', 'hihat', 'kick'],
    numBars: 1,
    beatsPerBar: 4,
    minNoteLength: 0.5,
    beatLengthSeconds: 0.4,
    restLikelyhoodPercentage: 38
  });

  // Prevent and infinite loop
  if (options.minNoteLength <= 0) options.minNoteLength = 0.25;

  var sounds = {
    tomtom: new Audio('sounds/tomtom.mp3'),
    floortom: new Audio('sounds/floortom.mp3'),
    hihat: new Audio('sounds/hi-hat.mp3'),
    kick: new Audio('sounds/kick.mp3')
  };

  /**
   * Generates and returns either a random
   * sound from the library, or a rest note.
   * @return {Audio} or `null` for a rest note.
   */
  var generateRandomSoundId = function() {
    // 50% change of being a rest note
    var isRestNote = Math.floor(Math.random() * 100) <= options.restLikelyhoodPercentage;
    if (isRestNote) return null;

    var randomSoundNum = Math.floor(Math.random() * options.beatVariations.length);
    return options.beatVariations[randomSoundNum];
  };

  /**
   * This creates and array of bars and fills them with sounds or rests.
   * @return {Array}
   */
  var fillBars = function() {
    // Reset all bars
    bars = [];

    // Generate {numBars} number of bars
    var currentBarNumber = 1;
    while (currentBarNumber <= options.numBars) {

      if (!bars[currentBarNumber - 1]) {
        bars.push([]);
      }

      var bar = bars[currentBarNumber - 1];

      // Generate {beatsPerBar} number of beats for this bar
      var currentBeatNumber = 1;
      while (currentBeatNumber <= options.beatsPerBar) {
        if (!bar[currentBeatNumber - 1]) {
          bar.push([]);
        }

        var beat = bar[currentBeatNumber - 1];

        // Generate {notesPerBeats} number of notes for this beat
        var notesPerBeat = (1 / options.minNoteLength);
        var currentNoteNumber = 1;
        while (currentNoteNumber <= notesPerBeat) {
          beat.push(generateRandomSoundId());
          currentNoteNumber += 1;
        }

        currentBeatNumber += 1;
      }

      currentBarNumber += 1;
    }

    return bars;
  };

  /**
   * Creates the random rythm, and starts the music.
   */
  var resetGenerator = function() {
    fillBars();
    resetPlaybackLoop();
  };

  var barNumber = 1;
  var beatNumber = 1;
  var noteNumber = 1;

  /**
   * Starts the playback loop
   */
  var resetPlaybackLoop = function() {
    clearInterval(barLooper);
    barLooper = setInterval(function() {
      var notesPerBeat = (1 / options.minNoteLength);

      // Play the sound at this index
      var bar = bars[barNumber - 1];
      var beat = bar[beatNumber - 1];
      var soundId = beat[noteNumber - 1];

      // Play is not a rest note (null)
      if (soundId && sounds[soundId]) {
        var sound = sounds[soundId];
        sound.pause();
        sound.currentTime = 0;
        sound.play();
      }

      // Move on the to next note
      noteNumber += 1;

      // Continuously loop bars and beats when they reach the end
      if (noteNumber > notesPerBeat) {
        noteNumber = 1;
        beatNumber += 1;
      }
      if (beatNumber > options.beatsPerBar) {
        beatNumber = 1;
        barNumber += 1;
      }
      if (barNumber > options.numBars) barNumber = 1;

    }, (options.beatLengthSeconds * 1000) * options.minNoteLength);
  };

  // Initial setup
  resetGenerator();


  /**
   * Render saved beats
   */
  var renderSavedBeats = function() {
    var list = '';
    for (var i = 0; i < savedBeats.length; i++) {
      list += '<div class="saved-beat" data-index="' + i + '">' +
                i +
                '<span class="delete-beat">X</span>' +
              '</div>';
    };
    if (!list) {
      list += '<span class="no-beats">No saved beats</span>';
    }
    $('.saved-beats').html(list);
    var $savedBeatItems = $('.saved-beat');
    $savedBeatItems.each(function() {
      var $el = $(this);
      var index = $el.data('index');
      $el.data('savedBeat', savedBeats[index]);

      $el.find('.delete-beat').on('click', function() {
        // Remove item at the index
        removeBeatAtIndex(index);
      });
    });
    $savedBeatItems.on('click', function(e) {
      var $el = $(e.target);
      var savedBeat = $el.data('savedBeat');

      // Set the options and bars from the saved beat
      bars    = savedBeat.bars;
      options = savedBeat.options;

      $savedBeatItems.removeClass('active');
      $el.addClass('active');

      setDefaultInputValues();
      updateUi();
      play();
    });
  };


  var updateUi = function() {
    $('[data-content]').each(function() {
      var $el = $(this);
      $el.text(options[$el.data('content')]);
    });
  };

  var setDefaultInputValues = function() {
    $('[data-option]').each(function() {
      var $el = $(this);
      $el.val(options[$el.data('option')]);
    });
  };


  setDefaultInputValues();
  updateUi();

  // Update generator each time a value changes
  $('[data-option]').on('change', function(e) {
    var $target = $(e.target);
    var value = $target.val();

    if (!$target.data('not-int')) {
      value = parseFloat(value);
    }

    options[$target.data('option')] = value;

    // Save this to user defaults
    updateUserDefault($target.data('option'), value);

    if ($target.data('reset')) {
      resetGenerator();
    } else {
      resetPlaybackLoop();
    }
    updateUi();
  });

  $('#generate-button').on('click', function() {
    resetGenerator();
    $('.saved-beat').removeClass('active');
    $playPuaseButton.text('Pause');
    var playing = true;
  });

  // Setup speed range slider
  $('input[type="range"]');

  // Allow user to save beat
  $('#save-button').on('click', saveCurrentBeat);

  // Setup play / pause
  var $playPuaseButton = $('#play-pause-button');

  var play = function() {
    resetPlaybackLoop();
    $playPuaseButton.text('Pause');
    playing = true;
  };
  var pause = function() {
    clearInterval(barLooper);
    $playPuaseButton.text('Play');
    playing = false;
  };

  var playing = true;
  var playPause = function() {
    if (playing) return pause();
    play();
  };
  $playPuaseButton.on('click', playPause);

  // Render the saved beats
  renderSavedBeats();

});
