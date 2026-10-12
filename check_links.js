fetch('https://sfiudbxjdcirkejidscl.supabase.co/rest/v1/recipe_ingredients?select=recipe_id,ingredient_id', {
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTQwMTcsImV4cCI6MjA5NTEzMDAxN30.W1JFAD-7vjIy1aHGJSH5jtlaCo8oZYMP2JiL2062wsw',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTQwMTcsImV4cCI6MjA5NTEzMDAxN30.W1JFAD-7vjIy1aHGJSH5jtlaCo8oZYMP2JiL2062wsw',
    }
}).then(r => r.json()).then(data => {
    console.log('Total recipe_ingredients links: ' + data.length);
});
