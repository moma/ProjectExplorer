/* ---------------------  histogram settings  ----------------------- */

mvacV2Hg.settings = {
    // ------------------
    // MANDATORY SETTINGS
    // ------------------

    // the endpoint must end in 'histogram'
    // (choose any endpoint from https://api.iscpif.fr/docs/)
    'apiEndpoint': '/pvt/climate/twitter/histogram',

    // if your endpoint starts with '/pvt', you will also need an API key
    'APIKey': '',

    // -----------------
    // OPTIONAL SETTINGS (leave them to null for default values)
    // -----------------

    // query settings
    'since': null,
    'until': null,
    'interval': 'day',   // accepted: 'day', 'week', 'month', 'year'

    // cumulated window settings (over how many intervals do we average ?)
    'avgWindowPerInterval': {
      'day': 7,
      'week': 3,
      'month': 3,
      'year': 2
    }
}
