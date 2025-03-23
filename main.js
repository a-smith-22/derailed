/*
TITLE: Train Crawler
AUTHOR: Andrew Smith
DATE: 
UPDATES:
- 
*/



// General Options
var isMobile;             // determines whether device is mobile or desktop, used for mouseclick/touch detection
var refresh_page = false; // used to refresh program when returning to title screen

// Display Graphics
var w_win, h_win;                       // window dimensions
const pw = 256; const ph = 280;         // game pixel dimensions (pixel blocks)
const pad_win = 0.06;                   // scale game to either width or height with 10% padding
var scl;                                // number of window pixels per game pixel
const txt_sz = 8;                       // size of main game text
const img_wd = 244; const img_ht = 121; // chapter drawing dimensions

// Color Pallette
const window_bkgd = '#b3d6e6';      // color around screen
const screen_bkgd = '#d6d9b4';      // game background color
const console_border = '#693c0d';   // border around game console
const txt_color = '#3b1b08';        // main text and border colors 
const img_fore = '#3b1b08';         // color to tint image line sketches
const img_bkgd = '#c4c7a3';         // color behind image
const opt_bkgd_u = '#d6d9b4';       // bar behind option text (unhighlighted)
const opt_bkgd_h = '#c4c7a3';       // bar behind option text (highlighted)
const stats_color = ['#821621','#204a99','#155e2d','#abad32', '#7133b8']; // [health, strength, wisdom, gold, inventory] stat colors
const car_unpl_color = '#525252';   // color for unplayed cars/chapters for progress bar
const car_past_color = '#a3a3a3';   // color for past cars/chapters for progress bar

// Game State
const num_chpts = 10; // how many chapters to play
var journey = [];     // list of chapter IDs for player's journey 
var chpt = 3;        // current chapter, see list below
/*
0 = menu
1 = help/instructions
2 = about/credits
3 = character selection
10-## = game chapters
*/ 
var curr_option = 'Null';      // selected option from current chapter, 'A', 'B', or 'Null'
var option_state = 1; // see list below
/*
0 = null
1 = select option (during game)
2 = add item to inventory
3 = waiting for animation (blank)
4 = continue after successful single/combat roll
5 = continue after unsuccessful single roll
6 = add item after successful roll
7 = reroll after failed combat roll
8 = continue after unsuccessful combat roll
9 = unused
10 = death screen, return to title screen/menu
*/
var num_options;        // number of options in current chapter, 1 (A only) or 2 (A and B)
var chpt_images = [];   // all chapter images
var item_images = [];   // all item images

// Player stats
var player_role = 0; // index of player role to use
const roles = [
    {role: 'Prospector', health: 9,     strength: 6,    wisdom: 2,  gold: 8,    inventory_size: 3},
    {role: 'Outlaw',     health: 11,    strength: 9,    wisdom: 1,  gold: 2,    inventory_size: 3},
    {role: 'Lawyer',     health: 10,    strength: 1,    wisdom: 8,  gold: 6,    inventory_size: 4},
    {role: 'Banker',     health: 7,     strength: 3,    wisdom: 7,  gold: 12,   inventory_size: 3},
    {role: 'Barkeep',    health: 12,    strength: 5,    wisdom: 4,  gold: 8,    inventory_size: 4},
]; 
var player_base_stats = {role: 'Default', health: 0, strength: 0, wisdom: 0, gold: 0, inventory_size: 0};   // base stats        -> based on role selected
var player_item_stats = {role: 'Default', health: 0, strength: 0, wisdom: 0, gold: 0, inventory_size: 0};   // item stats        -> change of player stats due to inventory items
var player_modf_stats = {role: 'Default', health: 0, strength: 0, wisdom: 0, gold: 0, inventory_size: 0};   // modified stats    -> base stats with all inventory items included
var player_accm_stats = {role: 'Default', health: 0, strength: 0, wisdom: 0, gold: 0, inventory_size: 0};   // accumulated stats -> increase/decrease of stats from chapter interactions
var player_curr_stats = {role: 'Default', health: 0, strength: 0, wisdom: 0, gold: 0, inventory_size: 0};   // current stats     -> current stats of player, based on inventory and all accumulated changes
const max_stat = 12;                // maximum value any one stat can be
const stat_x_pos = 50;              // px x position of stat bar
const stat_wd = 5;                  // px x width of stat bars
const stat_ht = 5;                  // px y height of stat bars
const txt_spacing = 9;              // text spacing from top
const txt_y_pos_0 = 10;             // first stat y pos

// Player inventory
var inventory = [1,-1,-1,-1] // player inventory, -1 = empty slot, # = item ID
const items = [
    {name: 'revolver', health: 0, strength: 3, wisdom: 0, gold: 0, img:'test.png'}
] // all collectible items
const inventory_xpos = 153; // px position to start inventory boxes
const inventory_ypos = 24; // " "
const inventory_wd = 21; // px size of each inventory box
const inventory_sp = 3; // px spacing between inventory boxes

// Roll parameters
var is_roll = true;         // allows player to roll
var combat_reroll = false;  // allows rerolling during combat
var roll_result = -1;       // value of roll
var sum_rolls = 0;          // sum of rolls, used for combat rolls
var roll_state = 0;         // 0 = no roll, 1 = rolling animation, 2 = final blink, 3 = display results, 4 = reset
const roll_speed_init = 2;  // initial speed of roll in frames per cursor movement
var roll_speed;             // current speed of roll (see above)
var start_frame;            // frame animation started on 
var prev_frame = 0;         // frame cursor was last moved on
var crs_pos_x = 0;          // stat value cursor is currently hovering over
var crs_pos_y = 0;          // vertical value for stat cursor (health = 0, strength = 1, etc.) 
var crs_tot_pos = 0;        // total number of cursor movements, used to define animation sequence
var roll_slow, roll_stop;   // position to start slowing roll animation, position to stop animation 

// Cursor options
var mx, my;                                                     // current mouse/cursor position
var mouse_state = [0,0];                                        // state of mouse for previous and current frame, 0 = null, 1 = pressed/tapped
var mouse_clicked = false;                                      // true only when mouse is just released, allows single click/tap action
var option_a_bounds = [0,0,0,0];                                // (xmin, xmax, ymin, ymax) position for cursor selection
var option_b_bounds = [0,0,0,0];                                // " "
var inv_bounds = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];  // (xmin, xmax, ymin, ymax) positions for cursor selection of inventory items (max of 4 items)



function preload() {
    // Load all graphics before running rest of code

    // Load all image files
    bkgd_img = loadImage('Images/bkgd.png'); // game background image
    for(let i=0; i<chpt_cards.length; i++){ 
        append(chpt_images, loadImage('Images/Chapters/'+chpt_cards[i].img)); // load each chapter image
    }
    for(let i=0; i<items.length; i++){ 
        append(item_images, loadImage('Images/Items/'+items[i].img)); // load each item image
    }


    // Load fonts
    main_txt_font = loadFont('Fonts/Tiny5-Regular.ttf'); 

}



function setup() {
    // General settings
    frameRate(30); 
    
    // Define display window 
    create_canvas();
    set_scale(); 

    // Determine device type
    let details = navigator.userAgent;
    let regexp = /android|iphone|kindle|ipad/i;
    isMobile = regexp.test(details);

    // Prevent roles from changing
    for(let i=0; i<roles.length; i++){
        Object.freeze(roles[i]); 
    }

    // Define chapter order
    shuffle_chpts(); 

}

function shuffle_chpts(){
    // Create chapter order for game

    // Main chapter order
    var rnd_chpts = shuffle(chpt_cards); // randomize chapter order
    let i = 0; // current chapter position
    let j = 0; // number of chapters searched (prevents endless recursion)
    while(i < num_chpts-1 && j < rnd_chpts.length*3){
        let test_chpt = rnd_chpts[0];                 // test chapter from shuffled list
        let min_chpt = test_chpt.min_level*num_chpts; // range of allowable chapter positions for current test chapter
        let max_chpt = test_chpt.max_level*num_chpts; // " "

        if(test_chpt.type != 'Boss' && test_chpt.type != 'Null' && i >= min_chpt && i <= max_chpt) { // chapter works in current journey slot
            append(journey,test_chpt); // add chapter to journey
            rnd_chpts.splice(0,1);     // remove test chapter from random list
            i=i+1;                       // increase chapter count
        } else { // chapter does not work in current position
            append(rnd_chpts,test_chpt); // move chapter to end to search later
            rnd_chpts.splice(0,1);       // 
        }

        j=j+1; // increase search count to prevent endless recursion
    }

    // Add boss chapter
    var rnd_chpts = shuffle(chpt_cards); // reshuffle chapters
    for(let k=0; i < rnd_chpts.length-1; k++){
        print(rnd_chpts[k]);
        if(rnd_chpts[k].type == 'Boss'){ // check if boss chapter
            append(journey,rnd_chpts[k]);
            break;
        }
    }
}



function windowResized() {
    // Update window dimensions and rescale
    create_canvas();
    set_scale();

}

function create_canvas() {
    // Gather window dimensions and create drawing canvas
    w_win = windowWidth; h_win = windowHeight; // get window dimensions
    createCanvas(w_win, h_win); // create blank screen
}

function set_scale() {
    // Determine game scale based on orientation and padding
    let win_ar = w_win / h_win; // window aspect ratio
    let gm_ar = pw / ph; // game aspect ratio
    if( win_ar > gm_ar ) {
        scl = h_win * (1-pad_win) / ph;
    } else {
        scl = w_win * (1-pad_win) / pw;
    }
}



function draw() {

    // Display background and scale screen
    //draw_background();  // show background image
    background(window_bkgd);
    draw_scale();
    draw_screen_bkgd();

    // Show GUI and template for chapters
    
    // Main code
    if(chpt==0){} // title/menu screen
        // add menu functions here
    if(chpt==1){} // help
    if(chpt==2){} // credits/about
    if(chpt==3){  // character selection
        player_base_stats = roles[player_role];
        chpt = 10; 
    } 
    if(chpt>=10){ // play levels
        set_num_opts();     // determines the number of options in current chapter
        update_cursor();    // sets cursor mx and my position
        inventory_update(); // displays inventory items and update stats
        GUI();              // title bar information
        dsp_chpt();         // image and chapter text
        play_chpt();        // allows user selection and rolling
    } 

    // Display screen frame
    draw_frame();

    // Refresh page
    if(refresh_page) { location.reload(); refresh_page = false; }
}

function draw_background() {
    // Display background
    background(window_bkgd); // color of window
    let bkgd_ar = 782/490; let win_ar = w_win/h_win; 
    tint(255,20); // lower opacity
    if(win_ar < bkgd_ar){image(bkgd_img,0,0,bkgd_ar*h_win,h_win);}  // scale to height
    else{image(bkgd_img,0,0,w_win,w_win/bkgd_ar);}                  // scale to width
}
function draw_scale() {
    // Enter 8 bit mode -> scaled coordinate system
    scale(scl);
    noSmooth(); // prevent anti-aliasing of edges on rescaling
    translate( (w_win-pw*scl)/(2*scl) , (h_win-ph*scl)/(2*scl)); // center on screen
}
function draw_screen_bkgd() {
    // Game console background
    fill(screen_bkgd);
    noStroke();
    rect(-1,-1,pw+2,ph+2,3);
}
function draw_frame() {
    // Game console frame
    noFill();
    stroke(console_border);
    strokeWeight(3);
    rect(-1,-1,pw+2,ph+2,3);
}



function set_num_opts(){
    // Determines the number of options in the current chapter
    let curr_chpt = journey[chpt-10];
    if(curr_chpt.action_b_prompt[1] == 'None') {
        num_options = 1;
    } 
    else {
        num_options = 2; 
    }
}

function update_cursor(){
    // Update cursor position
    mx = (mouseX / scl) - (w_win-pw*scl)/(2*scl); // Scale and translate cursor position
    my = (mouseY / scl) - (h_win-ph*scl)/(2*scl); // " "
    fill('#FF0000'); noStroke(); ellipse(mx, my, 10, 10); // Sow cursor position (for debugging)
}



function GUI() {
    // Display user stats and game data

    // Game title
    fill(txt_color); noStroke();
    textSize(txt_sz); textAlign(LEFT);
    text('Derailed by Andrew Smith', inventory_xpos,     txt_y_pos_0);

    // Inventory title
    fill(txt_color); noStroke();
    textSize(txt_sz); textAlign(LEFT);
    textFont(main_txt_font);
    text('Inventory', inventory_xpos, txt_y_pos_0 + txt_spacing);

    // Progress
    let progress_y_pos = txt_y_pos_0 + txt_spacing*5 - 1;                                       // vertical position of progress bar
    let train_car_sp = 2;                                                                       // px spacing of train car
    let train_car_ht = 8;                                                                       // px size of train car
    let train_car_wd = ( pw - stat_x_pos - txt_sz/2 - (num_chpts-1)*train_car_sp )/num_chpts;   // " "
    fill(txt_color); noStroke();
    textSize(txt_sz); textAlign(LEFT);
    textFont(main_txt_font);
    text('Progress', txt_sz/2, progress_y_pos + txt_sz*0.3);

    fill(car_unpl_color); noStroke();
    
    for(let i=0; i<num_chpts; i++){
        noStroke(); 
        if(i <= chpt-10){ fill(car_past_color); } // color cars based on if chapters have been completed
        if(i >  chpt-10){ fill(car_unpl_color); }

        if(i != num_chpts-1){ // body cars
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) , progress_y_pos - train_car_ht/2, train_car_wd, train_car_ht); // body
            
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.05,                                       progress_y_pos + train_car_ht*0.4, train_car_ht*0.3, train_car_ht*0.2); // wheels  
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.05 + train_car_ht*0.4,                    progress_y_pos + train_car_ht*0.4, train_car_ht*0.3, train_car_ht*0.2); // " "
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.95 - train_car_ht*0.3,                    progress_y_pos + train_car_ht*0.4, train_car_ht*0.3, train_car_ht*0.2); // " "
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.95 - train_car_ht*0.3 - train_car_ht*0.4, progress_y_pos + train_car_ht*0.4, train_car_ht*0.3, train_car_ht*0.2); // " "

            rect( stat_x_pos + i*(train_car_wd+train_car_sp), progress_y_pos + train_car_ht/2 - 2, train_car_wd + train_car_sp, 1); // connector
        }
        else { // front car
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) , progress_y_pos + train_car_ht/2 - train_car_ht*0.7, train_car_wd*0.8, train_car_ht*0.7); // body
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) , progress_y_pos - train_car_ht/2, train_car_wd*0.3, train_car_ht); // " "
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.7, progress_y_pos + train_car_ht/2 - train_car_ht*0.1, train_car_wd*0.3, train_car_ht*0.2); // nose
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.7, progress_y_pos + train_car_ht/2 - train_car_ht*0.4, train_car_wd*0.2, train_car_ht*0.4); // " "

            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.6, progress_y_pos - train_car_ht/2, train_car_wd*0.1, train_car_ht); // chimney

            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.06,                                             progress_y_pos + train_car_ht*0.4, train_car_ht*0.4, train_car_ht*0.2); // wheels  
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.06 + 1*(train_car_ht*0.4 + train_car_wd*0.03),  progress_y_pos + train_car_ht*0.4, train_car_ht*0.4, train_car_ht*0.2); // " "  
            rect( stat_x_pos + i*(train_car_wd+train_car_sp) + train_car_wd*0.06 + 2*(train_car_ht*0.4 + train_car_wd*0.03),  progress_y_pos + train_car_ht*0.4, train_car_ht*0.4, train_car_ht*0.2); // " "  
        }

    }


    // Player stat titles
    fill(txt_color); noStroke();
    textSize(txt_sz); textAlign(LEFT);
    textFont(main_txt_font);
    text('Role', txt_sz/2,     txt_y_pos_0 + txt_spacing*0);
    text('Health', txt_sz/2,   txt_y_pos_0 + txt_spacing*1);
    text('Strength', txt_sz/2, txt_y_pos_0 + txt_spacing*2);
    text('Wisdom', txt_sz/2,   txt_y_pos_0 + txt_spacing*3);
    text('Gold', txt_sz/2,     txt_y_pos_0 + txt_spacing*4);

    // Current player stats
    text(player_curr_stats.role, stat_x_pos, txt_y_pos_0); // show player role

    // Health
    for(let j=0; j<player_curr_stats.health; j++){ 
        fill(stats_color[0]); // fill color of stat bar
        stroke(stats_color[0]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*0 + txt_sz/2, stat_wd, stat_ht);
    }
    // Strength
    for(let j=0; j<player_curr_stats.strength; j++){ 
        fill(stats_color[1]); // fill color of stat bar
        stroke(stats_color[1]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*1 + txt_sz/2, stat_wd, stat_ht); 
    }
    // Wisdom
    for(let j=0; j<player_curr_stats.wisdom; j++){ 
        fill(stats_color[2]); // fill color of stat bar
        stroke(stats_color[2]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*2 + txt_sz/2, stat_wd, stat_ht); 
    }
    // Gold
    for(let j=0; j<player_curr_stats.gold; j++){ 
        fill(stats_color[3]); // fill color of stat bar
        stroke(stats_color[3]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*3 + txt_sz/2, stat_wd, stat_ht); 
    }

    // Modified stats -> hollow square = item removed stats, small square = item added stats
    // Health
    if(player_item_stats.health < 0){
        for(let j=0; j<abs(player_item_stats.health); j++){
            fill(screen_bkgd);                       // empty inside
            stroke(stats_color[0]); strokeWeight(1); // draw border of stat color
            rect(stat_x_pos + (player_curr_stats.health + j)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*0 + txt_sz/2, stat_wd, stat_ht);
        }
    }
    if(player_item_stats.health > 0){
        for(let j=0; j<abs(player_item_stats.health); j++){
            fill(stats_color[0]);                   // fill color of stat bar
            stroke(screen_bkgd); strokeWeight(1.5); // empty border
            rect(stat_x_pos + (player_curr_stats.health - j - 1)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*0 + txt_sz/2 , stat_wd, stat_ht);
        }
    }
    // Strength
    if(player_item_stats.strength < 0){
        for(let j=0; j<abs(player_item_stats.strength); j++){
            fill(screen_bkgd);                       // empty inside
            stroke(stats_color[1]); strokeWeight(1); // draw border of stat color
            rect(stat_x_pos + (player_curr_stats.strength + j)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*1 + txt_sz/2, stat_wd, stat_ht);
        }
    }
    if(player_item_stats.strength > 0){
        for(let j=0; j<abs(player_item_stats.strength); j++){
            fill(stats_color[1]);                   // fill color of stat bar
            stroke(screen_bkgd); strokeWeight(1.5); // empty border
            rect(stat_x_pos + (player_curr_stats.strength - j - 1)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*1 + txt_sz/2 , stat_wd, stat_ht);
        }
    }
    // Wisdom
    if(player_item_stats.wisdom < 0){
        for(let j=0; j<abs(player_item_stats.wisdom); j++){
            fill(screen_bkgd);                       // empty inside
            stroke(stats_color[2]); strokeWeight(1); // draw border of stat color
            rect(stat_x_pos + (player_curr_stats.wisdom + j)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*2 + txt_sz/2, stat_wd, stat_ht);
        }
    }
    if(player_item_stats.wisdom > 0){
        for(let j=0; j<abs(player_item_stats.wisdom); j++){
            fill(stats_color[2]);                   // fill color of stat bar
            stroke(screen_bkgd); strokeWeight(1.5); // empty border
            rect(stat_x_pos + (player_curr_stats.wisdom - j - 1)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*2 + txt_sz/2 , stat_wd, stat_ht);
        }
    }
    // Gold
    if(player_item_stats.gold < 0){
        for(let j=0; j<abs(player_item_stats.gold); j++){
            fill(screen_bkgd);                       // empty inside
            stroke(stats_color[3]); strokeWeight(1); // draw border of stat color
            rect(stat_x_pos + (player_curr_stats.gold + j)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*3 + txt_sz/2, stat_wd, stat_ht);
        }
    }
    if(player_item_stats.gold > 0){
        for(let j=0; j<abs(player_item_stats.gold); j++){
            fill(stats_color[3]);                   // fill color of stat bar
            stroke(screen_bkgd); strokeWeight(1.5); // empty border
            rect(stat_x_pos + (player_curr_stats.gold - j - 1)*(stat_wd+3), txt_y_pos_0+(txt_spacing)*3 + txt_sz/2 , stat_wd, stat_ht);
        }
    }
    
}

function dsp_chpt() {
    // Displays chapter image and prompt text

    var curr_chpt = journey[chpt-10]; 

    // Drawing image
    let title_y_pos = 64; // bottom of title block
    fill(img_bkgd); noStroke(); rect(6,title_y_pos,img_wd,img_ht); // background behind image
    tint(img_fore); noFill(); noStroke();
    image(chpt_images[chpt-10],6,title_y_pos,img_wd,img_ht); // display image

    // Image border
    noFill(); stroke(txt_color); strokeWeight(1); 
    rect(6,title_y_pos,img_wd,img_ht);

    // Parse through text
    let chpt_prompt = capitalize_first_word(curr_chpt.prompt);              // main chapter prompt, first paragraph
    let option_a_text = curr_chpt.action_a_prompt[0].toUpperCase() + ". ";  // full text for options a and b
    let option_b_text = curr_chpt.action_b_prompt[0].toUpperCase() + ". ";  // " "
    let option_as_text = ""; let option_af_text = "";                       // option a/b success/failure outcomes
    let option_bs_text = ""; let option_bf_text = "";                       // " "


    // Write option A text
    if(curr_chpt.action_a_prompt[1] == 'Roll'){
        if(curr_chpt.action_a_prompt[4] == 0) {
            option_a_text += "Roll a " + curr_chpt.action_a_prompt[5] + " or less in " + curr_chpt.action_a_prompt[2].toUpperCase() + ".";
        } 
        else {
            option_a_text += "Roll a " + curr_chpt.action_a_prompt[4] + " or above in " + curr_chpt.action_a_prompt[2].toUpperCase() + ".";
        } 
    }
    if(curr_chpt.action_a_prompt[1] == 'Combat'){
        option_a_text += "Roll a total of " + curr_chpt.action_a_prompt[3] + " in " + curr_chpt.action_a_prompt[2].toUpperCase() + " across all rolls.";
    }
    if(curr_chpt.action_a_prompt[1] == 'Item'){
        let item = items[curr_chpt.action_a_prompt[3]];
        option_a_text += "Add " + item.name.toUpperCase() + " to inventory (";
        let num_non_zeroes = 0; // number of item stat changes that are non-zero
        if(item.health != 0){ num_non_zeroes += 1; } if(item.strength != 0){ num_non_zeroes += 1; } if(item.wisdom != 0){ num_non_zeroes += 1; } if(item.gold != 0){ num_non_zeroes += 1; }
        if(num_non_zeroes == 0){ // item has no changes
            option_a_text += "+0 ALL STATS";
        }
        else if(num_non_zeroes == 1){ // single stat change
            if(item.health>0){ option_a_text += "+" + abs(item.health) + " HEALTH"; } if(item.health<0){ option_a_text += "-" + abs(item.health) + " HEALTH"; }
            if(item.strength>0){ option_a_text += "+" + abs(item.strength) + " STRENGTH"; } if(item.strength<0){ option_a_text += "-" + abs(item.strength) + " STRENGTH"; }
            if(item.wisdom>0){ option_a_text += "+" + abs(item.wisdom) + " WISDOM"; } if(item.wisdom<0){ option_a_text += "-" + abs(item.wisdom) + " WISDOM"; }
            if(item.gold>0){ option_a_text += "+" + abs(item.gold) + " GOLD"; } if(item.gold<0){ option_a_text += "-" + abs(item.gold) + " GOLD"; }
        }
        else if(num_non_zeroes == 2){ // 2 stat changes -> display positive change first
            let stat_max = -99; let stat_min = 99; 
            let first_stat = " "; let second_stat = " ";
            if(item.health>stat_max && item.health!=0){ stat_max = item.health; first_stat = "HEALTH"; }            if(item.health<stat_min && item.health!=0){ stat_min = item.health; second_stat = "HEALTH"; } 
            if(item.strength>stat_max && item.strength!=0){ stat_max = item.strength; first_stat = "STRENGTH"; }    if(item.strength<stat_min && item.strength!=0){ stat_min = item.strength; second_stat = "STRENGTH"; } 
            if(item.wisdom>stat_max && item.wisdom!=0){ stat_max = item.wisdom; first_stat = "WISDOM"; }            if(item.wisdom<stat_min && item.wisdom!=0){ stat_min = item.wisdom; second_stat = "WISDOM"; } 
            if(item.gold>stat_max && item.gold!=0){ stat_max = item.gold; first_stat = "GOLD"; }                    if(item.gold<stat_min && item.gold!=0){ stat_min = item.gold; second_stat = "GOLD"; } 

            if(stat_max>0 && stat_min>0){ option_a_text += "+" + abs(stat_max) + " " + first_stat + "/" + "+" + abs(stat_min) + " " + second_stat; }
            if(stat_max>0 && stat_min<0){ option_a_text += "+" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
            if(stat_max<0 && stat_min<0){ option_a_text += "-" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
        }
        else if(num_non_zeroes == 4){ // all stats have equal change
            if(item.health>0){ option_a_text += "+" + abs(item.health) + " ALL STATS"; }
            if(item.health<0){ option_a_text += "-" + abs(item.health) + " ALL STATS"; }
        }
        else { // default case, shouldnt happen
        }
        option_a_text += ").";
    }
    if(curr_chpt.action_a_prompt[1] == 'Continue'){
        option_a_text += "Continue to the next car.";
    }
    if(curr_chpt.action_a_prompt[1] == 'Stat'){
        option_a_text += "";
        if(curr_chpt.action_a_prompt[6][0] > 0){ option_a_text += "Increase +" + abs(curr_chpt.action_a_prompt[6][0]) + " HEALTH. "; } if(curr_chpt.action_a_prompt[6][0] < 0){ option_a_text += "Decrease -" + abs(curr_chpt.action_a_prompt[6][0]) + " HEALTH. "; }
        if(curr_chpt.action_a_prompt[6][1] > 0){ option_a_text += "Increase +" + abs(curr_chpt.action_a_prompt[6][1]) + " STRENGTH. "; } if(curr_chpt.action_a_prompt[6][1] < 0){ option_a_text += "Decrease -" + abs(curr_chpt.action_a_prompt[6][1]) + " STRENGTH. "; }
        if(curr_chpt.action_a_prompt[6][2] > 0){ option_a_text += "Increase +" + abs(curr_chpt.action_a_prompt[6][2]) + " WISDOM. "; } if(curr_chpt.action_a_prompt[6][2] < 0){ option_a_text += "Decrease -" + abs(curr_chpt.action_a_prompt[6][2]) + " WISDOM. "; }
        if(curr_chpt.action_a_prompt[6][3] > 0){ option_a_text += "Increase +" + abs(curr_chpt.action_a_prompt[6][3]) + " GOLD. "; } if(curr_chpt.action_a_prompt[6][3] < 0){ option_a_text += "Decrease -" + abs(curr_chpt.action_a_prompt[6][3]) + " GOLD. "; }
        if(curr_chpt.action_a_prompt[6][4] > 0){ option_a_text += "Increase +" + abs(curr_chpt.action_a_prompt[6][4]) + " INVENTORY. "; } if(curr_chpt.action_a_prompt[6][4] < 0){ option_a_text += "Decrease -" + abs(curr_chpt.action_a_prompt[6][4]) + " INVENTORY. "; }
    }


    // Write option B text
    if(curr_chpt.action_b_prompt[1] == 'Roll'){
        if(curr_chpt.action_b_prompt[4] == 0) {
            option_b_text += "Roll a " + curr_chpt.action_b_prompt[5] + " or less in " + curr_chpt.action_b_prompt[2].toUpperCase() + ".";
        } 
        else {
            option_b_text += "Roll a " + curr_chpt.action_b_prompt[4] + " or above in " + curr_chpt.action_b_prompt[2].toUpperCase() + ".";
        } 
    }
    if(curr_chpt.action_b_prompt[1] == 'Combat'){
        option_b_text += "Roll a total of " + curr_chpt.action_b_prompt[3] + " in " + curr_chpt.action_b_prompt[2].toUpperCase() + " across all rolls.";
    }
    if(curr_chpt.action_b_prompt[1] == 'Item'){
        let item = items[curr_chpt.action_b_prompt[3]];
        option_b_text += "Add " + item.name.toUpperCase() + " to inventory (";
        let num_non_zeroes = 0; // number of item stat changes that are non-zero
        if(item.health != 0){ num_non_zeroes += 1; } if(item.strength != 0){ num_non_zeroes += 1; } if(item.wisdom != 0){ num_non_zeroes += 1; } if(item.gold != 0){ num_non_zeroes += 1; }
        if(num_non_zeroes == 0){ // item has no changes
            option_b_text += "+0 ALL STATS";
        }
        else if(num_non_zeroes == 1){ // single stat change
            if(item.health>0){ option_b_text += "+" + abs(item.health) + " HEALTH"; } if(item.health<0){ option_b_text += "-" + abs(item.health) + " HEALTH"; }
            if(item.strength>0){ option_b_text += "+" + abs(item.strength) + " STRENGTH"; } if(item.strength<0){ option_b_text += "-" + abs(item.strength) + " STRENGTH"; }
            if(item.wisdom>0){ option_b_text += "+" + abs(item.wisdom) + " WISDOM"; } if(item.wisdom<0){ option_b_text += "-" + abs(item.wisdom) + " WISDOM"; }
            if(item.gold>0){ option_b_text += "+" + abs(item.gold) + " GOLD"; } if(item.gold<0){ option_b_text += "-" + abs(item.gold) + " GOLD"; }
        }
        else if(num_non_zeroes == 2){ // 2 stat changes -> display positive change first
            let stat_max = -99; let stat_min = 99; 
            let first_stat = " "; let second_stat = " ";
            if(item.health>stat_max && item.health!=0){ stat_max = item.health; first_stat = "HEALTH"; }            if(item.health<stat_min && item.health!=0){ stat_min = item.health; second_stat = "HEALTH"; } 
            if(item.strength>stat_max && item.strength!=0){ stat_max = item.strength; first_stat = "STRENGTH"; }    if(item.strength<stat_min && item.strength!=0){ stat_min = item.strength; second_stat = "STRENGTH"; } 
            if(item.wisdom>stat_max && item.wisdom!=0){ stat_max = item.wisdom; first_stat = "WISDOM"; }            if(item.wisdom<stat_min && item.wisdom!=0){ stat_min = item.wisdom; second_stat = "WISDOM"; } 
            if(item.gold>stat_max && item.gold!=0){ stat_max = item.gold; first_stat = "GOLD"; }                    if(item.gold<stat_min && item.gold!=0){ stat_min = item.gold; second_stat = "GOLD"; } 

            if(stat_max>0 && stat_min>0){ option_b_text += "+" + abs(stat_max) + " " + first_stat + "/" + "+" + abs(stat_min) + " " + second_stat; }
            if(stat_max>0 && stat_min<0){ option_b_text += "+" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
            if(stat_max<0 && stat_min<0){ option_b_text += "-" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
        }
        else if(num_non_zeroes == 4){ // all stats have equal change
            if(item.health>0){ option_b_text += "+" + abs(item.health) + " ALL STATS"; }
            if(item.health<0){ option_b_text += "-" + abs(item.health) + " ALL STATS"; }
        }
        else { // default case, shouldnt happen
        }
        option_b_text += ").";
    }
    if(curr_chpt.action_b_prompt[1] == 'Continue'){
        option_b_text += "Continue to the next car.";
    }
    if(curr_chpt.action_b_prompt[1] == 'Stat'){
        option_b_text += "";
        if(curr_chpt.action_b_prompt[6][0] > 0){ option_b_text += "Increase +" + abs(curr_chpt.action_b_prompt[6][0]) + " HEALTH. "; } if(curr_chpt.action_b_prompt[6][0] < 0){ option_b_text += "Decrease -" + abs(curr_chpt.action_b_prompt[6][0]) + " HEALTH. "; }
        if(curr_chpt.action_b_prompt[6][1] > 0){ option_b_text += "Increase +" + abs(curr_chpt.action_b_prompt[6][1]) + " STRENGTH. "; } if(curr_chpt.action_b_prompt[6][1] < 0){ option_b_text += "Decrease -" + abs(curr_chpt.action_b_prompt[6][1]) + " STRENGTH. "; }
        if(curr_chpt.action_b_prompt[6][2] > 0){ option_b_text += "Increase +" + abs(curr_chpt.action_b_prompt[6][2]) + " WISDOM. "; } if(curr_chpt.action_b_prompt[6][2] < 0){ option_b_text += "Decrease -" + abs(curr_chpt.action_b_prompt[6][2]) + " WISDOM. "; }
        if(curr_chpt.action_b_prompt[6][3] > 0){ option_b_text += "Increase +" + abs(curr_chpt.action_b_prompt[6][3]) + " GOLD. "; } if(curr_chpt.action_b_prompt[6][3] < 0){ option_b_text += "Decrease -" + abs(curr_chpt.action_b_prompt[6][3]) + " GOLD. "; }
        if(curr_chpt.action_b_prompt[6][4] > 0){ option_b_text += "Increase +" + abs(curr_chpt.action_b_prompt[6][4]) + " INVENTORY. "; } if(curr_chpt.action_b_prompt[6][4] < 0){ option_b_text += "Decrease -" + abs(curr_chpt.action_b_prompt[6][4]) + " INVENTORY. "; }
    }


    // Write option A success
    if(curr_chpt.action_a_success[0] == 'Item'){
        let item = items[curr_chpt.action_a_success[1]];
        option_as_text += "Add " + item.name.toUpperCase() + " to inventory (";
        let num_non_zeroes = 0; // number of item stat changes that are non-zero
        if(item.health != 0){ num_non_zeroes += 1; } if(item.strength != 0){ num_non_zeroes += 1; } if(item.wisdom != 0){ num_non_zeroes += 1; } if(item.gold != 0){ num_non_zeroes += 1; }
        if(num_non_zeroes == 0){ // item has no changes
            option_as_text += "+0 ALL STATS";
        }
        else if(num_non_zeroes == 1){ // single stat change
            if(item.health>0){ option_as_text += "+" + abs(item.health) + " HEALTH"; } if(item.health<0){ option_as_text += "-" + abs(item.health) + " HEALTH"; }
            if(item.strength>0){ option_as_text += "+" + abs(item.strength) + " STRENGTH"; } if(item.strength<0){ option_as_text += "-" + abs(item.strength) + " STRENGTH"; }
            if(item.wisdom>0){ option_as_text += "+" + abs(item.wisdom) + " WISDOM"; } if(item.wisdom<0){ option_as_text += "-" + abs(item.wisdom) + " WISDOM"; }
            if(item.gold>0){ option_as_text += "+" + abs(item.gold) + " GOLD"; } if(item.gold<0){ option_as_text += "-" + abs(item.gold) + " GOLD"; }
        }
        else if(num_non_zeroes == 2){ // 2 stat changes -> display positive change first
            let stat_max = -99; let stat_min = 99; 
            let first_stat = " "; let second_stat = " ";
            if(item.health>stat_max && item.health!=0){ stat_max = item.health; first_stat = "HEALTH"; }            if(item.health<stat_min && item.health!=0){ stat_min = item.health; second_stat = "HEALTH"; } 
            if(item.strength>stat_max && item.strength!=0){ stat_max = item.strength; first_stat = "STRENGTH"; }    if(item.strength<stat_min && item.strength!=0){ stat_min = item.strength; second_stat = "STRENGTH"; } 
            if(item.wisdom>stat_max && item.wisdom!=0){ stat_max = item.wisdom; first_stat = "WISDOM"; }            if(item.wisdom<stat_min && item.wisdom!=0){ stat_min = item.wisdom; second_stat = "WISDOM"; } 
            if(item.gold>stat_max && item.gold!=0){ stat_max = item.gold; first_stat = "GOLD"; }                    if(item.gold<stat_min && item.gold!=0){ stat_min = item.gold; second_stat = "GOLD"; } 

            if(stat_max>0 && stat_min>0){ option_as_text += "+" + abs(stat_max) + " " + first_stat + "/" + "+" + abs(stat_min) + " " + second_stat; }
            if(stat_max>0 && stat_min<0){ option_as_text += "+" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
            if(stat_max<0 && stat_min<0){ option_as_text += "-" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
        }
        else if(num_non_zeroes == 4){ // all stats have equal change
            if(item.health>0){ option_as_text += "+" + abs(item.health) + " ALL STATS"; }
            if(item.health<0){ option_as_text += "-" + abs(item.health) + " ALL STATS"; }
        }
        else { // default case, shouldnt happen
        }
        option_as_text += ").";
    }
    if(curr_chpt.action_a_success[0] == 'Stat'){
        option_as_text += "";
        if(curr_chpt.action_a_success[3] == ''){ // no alt text given
            if(curr_chpt.action_a_success[2][0] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][0]) + " HEALTH. "; } if(curr_chpt.action_a_success[2][0] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][0]) + " HEALTH. "; }
            if(curr_chpt.action_a_success[2][1] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][1]) + " STRENGTH. "; } if(curr_chpt.action_a_success[2][1] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][1]) + " STRENGTH. "; }
            if(curr_chpt.action_a_success[2][2] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][2]) + " WISDOM. "; } if(curr_chpt.action_a_success[2][2] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][2]) + " WISDOM. "; }
            if(curr_chpt.action_a_success[2][3] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][3]) + " GOLD. "; } if(curr_chpt.action_a_success[2][3] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][3]) + " GOLD. "; }
            if(curr_chpt.action_a_success[2][4] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][4]) + " INVENTORY. "; } if(curr_chpt.action_a_success[2][4] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][4]) + " INVENTORY. "; }
        }
        if(curr_chpt.action_a_success[3] != ''){ // alt text, assume only one stat change
            option_as_text += curr_chpt.action_a_success[3];
            if(curr_chpt.action_a_success[2][0] > 0){ option_as_text += " (+" + abs(curr_chpt.action_a_success[2][0]) + " HEALTH)."} if(curr_chpt.action_a_success[2][0] < 0){ option_as_text += " (-" + abs(curr_chpt.action_a_success[2][0]) + " HEALTH)."}
            if(curr_chpt.action_a_success[2][1] > 0){ option_as_text += " (+" + abs(curr_chpt.action_a_success[2][1]) + " STRENGTH)."} if(curr_chpt.action_a_success[2][1] < 0){ option_as_text += " (-" + abs(curr_chpt.action_a_success[2][1]) + " STRENGTH)."}
            if(curr_chpt.action_a_success[2][2] > 0){ option_as_text += " (+" + abs(curr_chpt.action_a_success[2][2]) + " WISDOM)."} if(curr_chpt.action_a_success[2][2] < 0){ option_as_text += " (-" + abs(curr_chpt.action_a_success[2][2]) + " WISDOM)."}
            if(curr_chpt.action_a_success[2][3] > 0){ option_as_text += " (+" + abs(curr_chpt.action_a_success[2][3]) + " GOLD)."} if(curr_chpt.action_a_success[2][3] < 0){ option_as_text += " (-" + abs(curr_chpt.action_a_success[2][3]) + " GOLD)."}
            if(curr_chpt.action_a_success[2][4] > 0){ option_as_text += " (+" + abs(curr_chpt.action_a_success[2][4]) + " INVENTORY)."} if(curr_chpt.action_a_success[2][4] < 0){ option_as_text += " (-" + abs(curr_chpt.action_a_success[2][4]) + " INVENTORY)."}
        }
    }
    if(curr_chpt.action_a_success[0] == 'Continue'){
        option_as_text += "Continue to the next car.";
    }
    if(curr_chpt.action_a_success[0] == 'None'){
        option_as_text += ""; // empty prompt
    }

    // Write option A failure
    if(curr_chpt.action_a_failure[0] == 'Item'){
        let item = items[curr_chpt.action_a_failure[1]];
        option_af_text += "Add " + item.name.toUpperCase() + " to inventory (";
        let num_non_zeroes = 0; // number of item stat changes that are non-zero
        if(item.health != 0){ num_non_zeroes += 1; } if(item.strength != 0){ num_non_zeroes += 1; } if(item.wisdom != 0){ num_non_zeroes += 1; } if(item.gold != 0){ num_non_zeroes += 1; }
        if(num_non_zeroes == 0){ // item has no changes
            option_af_text += "+0 ALL STATS";
        }
        else if(num_non_zeroes == 1){ // single stat change
            if(item.health>0){ option_af_text += "+" + abs(item.health) + " HEALTH"; } if(item.health<0){ option_af_text += "-" + abs(item.health) + " HEALTH"; }
            if(item.strength>0){ option_af_text += "+" + abs(item.strength) + " STRENGTH"; } if(item.strength<0){ option_af_text += "-" + abs(item.strength) + " STRENGTH"; }
            if(item.wisdom>0){ option_af_text += "+" + abs(item.wisdom) + " WISDOM"; } if(item.wisdom<0){ option_af_text += "-" + abs(item.wisdom) + " WISDOM"; }
            if(item.gold>0){ option_af_text += "+" + abs(item.gold) + " GOLD"; } if(item.gold<0){ option_af_text += "-" + abs(item.gold) + " GOLD"; }
        }
        else if(num_non_zeroes == 2){ // 2 stat changes -> display positive change first
            let stat_max = -99; let stat_min = 99; 
            let first_stat = " "; let second_stat = " ";
            if(item.health>stat_max && item.health!=0){ stat_max = item.health; first_stat = "HEALTH"; }            if(item.health<stat_min && item.health!=0){ stat_min = item.health; second_stat = "HEALTH"; } 
            if(item.strength>stat_max && item.strength!=0){ stat_max = item.strength; first_stat = "STRENGTH"; }    if(item.strength<stat_min && item.strength!=0){ stat_min = item.strength; second_stat = "STRENGTH"; } 
            if(item.wisdom>stat_max && item.wisdom!=0){ stat_max = item.wisdom; first_stat = "WISDOM"; }            if(item.wisdom<stat_min && item.wisdom!=0){ stat_min = item.wisdom; second_stat = "WISDOM"; } 
            if(item.gold>stat_max && item.gold!=0){ stat_max = item.gold; first_stat = "GOLD"; }                    if(item.gold<stat_min && item.gold!=0){ stat_min = item.gold; second_stat = "GOLD"; } 

            if(stat_max>0 && stat_min>0){ option_af_text += "+" + abs(stat_max) + " " + first_stat + "/" + "+" + abs(stat_min) + " " + second_stat; }
            if(stat_max>0 && stat_min<0){ option_af_text += "+" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
            if(stat_max<0 && stat_min<0){ option_af_text += "-" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
        }
        else if(num_non_zeroes == 4){ // all stats have equal change
            if(item.health>0){ option_af_text += "+" + abs(item.health) + " ALL STATS"; }
            if(item.health<0){ option_af_text += "-" + abs(item.health) + " ALL STATS"; }
        }
        else { // default case, shouldnt happen
        }
        option_af_text += ").";
    }
    if(curr_chpt.action_a_failure[0] == 'Stat'){
        option_af_text += "";
        if(curr_chpt.action_a_failure[3] == ''){ // no alt text given
            if(curr_chpt.action_a_failure[2][0] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH. "; } if(curr_chpt.action_a_failure[2][0] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH. "; }
            if(curr_chpt.action_a_failure[2][1] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH. "; } if(curr_chpt.action_a_failure[2][1] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH. "; }
            if(curr_chpt.action_a_failure[2][2] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM. "; } if(curr_chpt.action_a_failure[2][2] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM. "; }
            if(curr_chpt.action_a_failure[2][3] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD. "; } if(curr_chpt.action_a_failure[2][3] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD. "; }
            if(curr_chpt.action_a_failure[2][4] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY. "; } if(curr_chpt.action_a_failure[2][4] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY. "; }
        }
        if(curr_chpt.action_a_failure[3] != ''){ // alt text, assume only one stat change
            option_af_text += curr_chpt.action_a_failure[3];
            if(curr_chpt.action_a_failure[2][0] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH)."} if(curr_chpt.action_a_failure[2][0] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH)."}
            if(curr_chpt.action_a_failure[2][1] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH)."} if(curr_chpt.action_a_failure[2][1] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH)."}
            if(curr_chpt.action_a_failure[2][2] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM)."} if(curr_chpt.action_a_failure[2][2] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM)."}
            if(curr_chpt.action_a_failure[2][3] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD)."} if(curr_chpt.action_a_failure[2][3] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD)."}
            if(curr_chpt.action_a_failure[2][4] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY)."} if(curr_chpt.action_a_failure[2][4] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY)."}
        }
        if(curr_chpt.action_a_prompt[1] == 'Combat'){
            option_af_text = option_af_text.slice(0,-2); // remove period
            option_af_text += " each unsuccessful roll."
        }
    }
    if(curr_chpt.action_a_failure[0] == 'Continue'){
        option_af_text += "Continue to the next car.";
    }
    if(curr_chpt.action_a_failure[0] == 'None'){
        option_af_text += ""; // empty prompt
    }

    // Write option B success
    if(curr_chpt.action_b_success[0] == 'Item'){
        let item = items[curr_chpt.action_b_success[1]];
        option_bs_text += "Add " + item.name.toUpperCase() + " to inventory (";
        let num_non_zeroes = 0; // number of item stat changes that are non-zero
        if(item.health != 0){ num_non_zeroes += 1; } if(item.strength != 0){ num_non_zeroes += 1; } if(item.wisdom != 0){ num_non_zeroes += 1; } if(item.gold != 0){ num_non_zeroes += 1; }
        if(num_non_zeroes == 0){ // item has no changes
            option_bs_text += "+0 ALL STATS";
        }
        else if(num_non_zeroes == 1){ // single stat change
            if(item.health>0){ option_bs_text += "+" + abs(item.health) + " HEALTH"; } if(item.health<0){ option_bs_text += "-" + abs(item.health) + " HEALTH"; }
            if(item.strength>0){ option_bs_text += "+" + abs(item.strength) + " STRENGTH"; } if(item.strength<0){ option_bs_text += "-" + abs(item.strength) + " STRENGTH"; }
            if(item.wisdom>0){ option_bs_text += "+" + abs(item.wisdom) + " WISDOM"; } if(item.wisdom<0){ option_bs_text += "-" + abs(item.wisdom) + " WISDOM"; }
            if(item.gold>0){ option_bs_text += "+" + abs(item.gold) + " GOLD"; } if(item.gold<0){ option_bs_text += "-" + abs(item.gold) + " GOLD"; }
        }
        else if(num_non_zeroes == 2){ // 2 stat changes -> display positive change first
            let stat_max = -99; let stat_min = 99; 
            let first_stat = " "; let second_stat = " ";
            if(item.health>stat_max && item.health!=0){ stat_max = item.health; first_stat = "HEALTH"; }            if(item.health<stat_min && item.health!=0){ stat_min = item.health; second_stat = "HEALTH"; } 
            if(item.strength>stat_max && item.strength!=0){ stat_max = item.strength; first_stat = "STRENGTH"; }    if(item.strength<stat_min && item.strength!=0){ stat_min = item.strength; second_stat = "STRENGTH"; } 
            if(item.wisdom>stat_max && item.wisdom!=0){ stat_max = item.wisdom; first_stat = "WISDOM"; }            if(item.wisdom<stat_min && item.wisdom!=0){ stat_min = item.wisdom; second_stat = "WISDOM"; } 
            if(item.gold>stat_max && item.gold!=0){ stat_max = item.gold; first_stat = "GOLD"; }                    if(item.gold<stat_min && item.gold!=0){ stat_min = item.gold; second_stat = "GOLD"; } 

            if(stat_max>0 && stat_min>0){ option_bs_text += "+" + abs(stat_max) + " " + first_stat + "/" + "+" + abs(stat_min) + " " + second_stat; }
            if(stat_max>0 && stat_min<0){ option_bs_text += "+" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
            if(stat_max<0 && stat_min<0){ option_bs_text += "-" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
        }
        else if(num_non_zeroes == 4){ // all stats have equal change
            if(item.health>0){ option_bs_text += "+" + abs(item.health) + " ALL STATS"; }
            if(item.health<0){ option_bs_text += "-" + abs(item.health) + " ALL STATS"; }
        }
        else { // default case, shouldnt happen
        }
        option_bs_text += ").";
    }
    if(curr_chpt.action_b_success[0] == 'Stat'){
        option_bs_text += "";
        if(curr_chpt.action_b_success[3] == ''){ // no alt text given
            if(curr_chpt.action_b_success[2][0] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][0]) + " HEALTH. "; } if(curr_chpt.action_b_success[2][0] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][0]) + " HEALTH. "; }
            if(curr_chpt.action_b_success[2][1] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][1]) + " STRENGTH. "; } if(curr_chpt.action_b_success[2][1] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][1]) + " STRENGTH. "; }
            if(curr_chpt.action_b_success[2][2] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][2]) + " WISDOM. "; } if(curr_chpt.action_b_success[2][2] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][2]) + " WISDOM. "; }
            if(curr_chpt.action_b_success[2][3] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][3]) + " GOLD. "; } if(curr_chpt.action_b_success[2][3] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][3]) + " GOLD. "; }
            if(curr_chpt.action_b_success[2][4] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][4]) + " INVENTORY. "; } if(curr_chpt.action_b_success[2][4] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][4]) + " INVENTORY. "; }
        }
        if(curr_chpt.action_b_success[3] != ''){ // alt text, assume only one stat change
            option_bs_text += curr_chpt.action_b_success[3];
            if(curr_chpt.action_b_success[2][0] > 0){ option_bs_text += " (+" + abs(curr_chpt.action_b_success[2][0]) + " HEALTH)."} if(curr_chpt.action_b_success[2][0] < 0){ option_bs_text += " (-" + abs(curr_chpt.action_b_success[2][0]) + " HEALTH)."}
            if(curr_chpt.action_b_success[2][1] > 0){ option_bs_text += " (+" + abs(curr_chpt.action_b_success[2][1]) + " STRENGTH)."} if(curr_chpt.action_b_success[2][1] < 0){ option_bs_text += " (-" + abs(curr_chpt.action_b_success[2][1]) + " STRENGTH)."}
            if(curr_chpt.action_b_success[2][2] > 0){ option_bs_text += " (+" + abs(curr_chpt.action_b_success[2][2]) + " WISDOM)."} if(curr_chpt.action_b_success[2][2] < 0){ option_bs_text += " (-" + abs(curr_chpt.action_b_success[2][2]) + " WISDOM)."}
            if(curr_chpt.action_b_success[2][3] > 0){ option_bs_text += " (+" + abs(curr_chpt.action_b_success[2][3]) + " GOLD)."} if(curr_chpt.action_b_success[2][3] < 0){ option_bs_text += " (-" + abs(curr_chpt.action_b_success[2][3]) + " GOLD)."}
            if(curr_chpt.action_b_success[2][4] > 0){ option_bs_text += " (+" + abs(curr_chpt.action_b_success[2][4]) + " INVENTORY)."} if(curr_chpt.action_b_success[2][4] < 0){ option_bs_text += " (-" + abs(curr_chpt.action_b_success[2][4]) + " INVENTORY)."}
        }
    }
    if(curr_chpt.action_b_success[0] == 'Continue'){
        option_bs_text += "Continue to the next car.";
    }
    if(curr_chpt.action_b_success[0] == 'None'){
        option_bs_text += ""; // empty prompt
    }

    // Write option B failure
    if(curr_chpt.action_b_failure[0] == 'Item'){
        let item = items[curr_chpt.action_b_failure[1]];
        option_bf_text += "Add " + item.name.toUpperCase() + " to inventory (";
        let num_non_zeroes = 0; // number of item stat changes that are non-zero
        if(item.health != 0){ num_non_zeroes += 1; } if(item.strength != 0){ num_non_zeroes += 1; } if(item.wisdom != 0){ num_non_zeroes += 1; } if(item.gold != 0){ num_non_zeroes += 1; }
        if(num_non_zeroes == 0){ // item has no changes
            option_bf_text += "+0 ALL STATS";
        }
        else if(num_non_zeroes == 1){ // single stat change
            if(item.health>0){ option_bf_text += "+" + abs(item.health) + " HEALTH"; } if(item.health<0){ option_bf_text += "-" + abs(item.health) + " HEALTH"; }
            if(item.strength>0){ option_bf_text += "+" + abs(item.strength) + " STRENGTH"; } if(item.strength<0){ option_bf_text += "-" + abs(item.strength) + " STRENGTH"; }
            if(item.wisdom>0){ option_bf_text += "+" + abs(item.wisdom) + " WISDOM"; } if(item.wisdom<0){ option_bf_text += "-" + abs(item.wisdom) + " WISDOM"; }
            if(item.gold>0){ option_bf_text += "+" + abs(item.gold) + " GOLD"; } if(item.gold<0){ option_bf_text += "-" + abs(item.gold) + " GOLD"; }
        }
        else if(num_non_zeroes == 2){ // 2 stat changes -> display positive change first
            let stat_max = -99; let stat_min = 99; 
            let first_stat = " "; let second_stat = " ";
            if(item.health>stat_max && item.health!=0){ stat_max = item.health; first_stat = "HEALTH"; }            if(item.health<stat_min && item.health!=0){ stat_min = item.health; second_stat = "HEALTH"; } 
            if(item.strength>stat_max && item.strength!=0){ stat_max = item.strength; first_stat = "STRENGTH"; }    if(item.strength<stat_min && item.strength!=0){ stat_min = item.strength; second_stat = "STRENGTH"; } 
            if(item.wisdom>stat_max && item.wisdom!=0){ stat_max = item.wisdom; first_stat = "WISDOM"; }            if(item.wisdom<stat_min && item.wisdom!=0){ stat_min = item.wisdom; second_stat = "WISDOM"; } 
            if(item.gold>stat_max && item.gold!=0){ stat_max = item.gold; first_stat = "GOLD"; }                    if(item.gold<stat_min && item.gold!=0){ stat_min = item.gold; second_stat = "GOLD"; } 

            if(stat_max>0 && stat_min>0){ option_bf_text += "+" + abs(stat_max) + " " + first_stat + "/" + "+" + abs(stat_min) + " " + second_stat; }
            if(stat_max>0 && stat_min<0){ option_bf_text += "+" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
            if(stat_max<0 && stat_min<0){ option_bf_text += "-" + abs(stat_max) + " " + first_stat + "/" + "-" + abs(stat_min) + " " + second_stat; }
        }
        else if(num_non_zeroes == 4){ // all stats have equal change
            if(item.health>0){ option_bf_text += "+" + abs(item.health) + " ALL STATS"; }
            if(item.health<0){ option_bf_text += "-" + abs(item.health) + " ALL STATS"; }
        }
        else { // default case, shouldnt happen
        }
        option_bf_text += ").";
    }
    if(curr_chpt.action_b_failure[0] == 'Stat'){
        option_bf_text += "";
        if(curr_chpt.action_b_failure[3] == ''){ // no alt text given
            if(curr_chpt.action_b_failure[2][0] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH. "; } if(curr_chpt.action_b_failure[2][0] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH. "; }
            if(curr_chpt.action_b_failure[2][1] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH. "; } if(curr_chpt.action_b_failure[2][1] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH. "; }
            if(curr_chpt.action_b_failure[2][2] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM. "; } if(curr_chpt.action_b_failure[2][2] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM. "; }
            if(curr_chpt.action_b_failure[2][3] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD. "; } if(curr_chpt.action_b_failure[2][3] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD. "; }
            if(curr_chpt.action_b_failure[2][4] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY. "; } if(curr_chpt.action_b_failure[2][4] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY. "; }
        }
        if(curr_chpt.action_b_failure[3] != ''){ // alt text, assume only one stat change
            option_bf_text += curr_chpt.action_b_failure[3];
            if(curr_chpt.action_b_failure[2][0] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH)."} if(curr_chpt.action_b_failure[2][0] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH)."}
            if(curr_chpt.action_b_failure[2][1] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH)."} if(curr_chpt.action_b_failure[2][1] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH)."}
            if(curr_chpt.action_b_failure[2][2] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM)."} if(curr_chpt.action_b_failure[2][2] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM)."}
            if(curr_chpt.action_b_failure[2][3] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD)."} if(curr_chpt.action_b_failure[2][3] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD)."}
            if(curr_chpt.action_b_failure[2][4] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY)."} if(curr_chpt.action_b_failure[2][4] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY)."}
        }
        if(curr_chpt.action_b_prompt[1] == 'Combat'){
            option_bf_text = option_bf_text.slice(0,-2); // remove period
            option_bf_text += " each unsuccessful roll."
        }
    }
    if(curr_chpt.action_b_failure[0] == 'Continue'){
        option_bf_text += "Continue to the next car.";
    }
    if(curr_chpt.action_b_failure[0] == 'None'){
        option_bf_text += ""; // empty prompt
    }

    // Ignore null options
    if(curr_chpt.action_a_prompt[1] == 'None'){
        option_a_text = ''; option_as_text = ''; option_af_text = '';
    }
    if(curr_chpt.action_b_prompt[1] == 'None'){
        option_b_text = ''; option_bs_text = ''; option_bf_text = '';
    }

    // Ignore success/failure for non-rolling options
    if(curr_chpt.action_a_prompt[1] != 'Roll' && curr_chpt.action_a_prompt[1] != 'Combat'){
        option_as_text = ''; option_af_text = '';
    }
    if(curr_chpt.action_b_prompt[1] != 'Roll' && curr_chpt.action_b_prompt[1] != 'Combat'){
        option_bs_text = ''; option_bf_text = '';
    }


    // Show bars behind options
    var prompt_y_pos = 195; 
    noStroke();
    if(curr_chpt.action_a_prompt[1] != 'None' && option_state == 1){
        if(mx >= option_a_bounds[0] && mx <= option_a_bounds[1] && my >= option_a_bounds[2] && my <= option_a_bounds[3]) {
            fill(opt_bkgd_h); // highlighted color
        } else {
            fill(opt_bkgd_u); // unhighlighted color
        }
        rect(0, prompt_y_pos + txt_sz*2.55, pw, txt_sz*3.25);
    }
    if(curr_chpt.action_b_prompt[1] != 'None' && option_state == 1){
        if(mx >= option_b_bounds[0] && mx <= option_b_bounds[1] && my >= option_b_bounds[2] && my <= option_b_bounds[3]) {
            fill(opt_bkgd_h); // highlighted color
        } else {
            fill(opt_bkgd_u); // unhighlighted color
        }
        rect(0, prompt_y_pos + txt_sz*6.05, pw, txt_sz*3.25);
    }

    // Display prompt and options
    textSize(txt_sz); noStroke(); textLeading(txt_sz); textAlign(LEFT);
    fill(txt_color);
    text(chpt_prompt, 3, prompt_y_pos, pw-txt_sz, ph);

    dsp_chpt_text([option_a_text, option_as_text, option_af_text, option_b_text, option_bs_text, option_bf_text]); // display options with stat names color changed

    // Display instructions
    textSize(txt_sz); noStroke(); textLeading(txt_sz); textAlign(RIGHT);
    fill(txt_color);
    let inst_x = pw-3;
    let inst_y = prompt_y_pos + txt_sz*10.2;
    if(option_state==1){
        text("Tap to select option", inst_x, inst_y);
    }

    // Overlay text for item/roll/combat/death events
    dsp_chpt_2(); 

}

function dsp_chpt_2(){
    // Overlay options with additional text for rolling/combat/item events

    // Cover block parameters
    var cover_y_pos = -ph; // rectangle to block text
    var cover_y_ht  = txt_sz*3.5; // " "
    var txt_line_y = [-ph,-ph,-ph]; // position of each line of text
    var txt_line_x = [txt_sz/2,txt_sz/2,txt_sz/2]; // " "
    var txt = ['aaosdnasdn','aaosndaosnd','aaosndaosnd']; // each line of cover text

    // Determine position
    if(curr_option == 'A'){ // if option A is selected then cover option B
        cover_y_pos = 195+txt_sz*2.5-1; 
        txt_line_y = [195+txt_sz*3.5, 195+txt_sz*4.5, 195+txt_sz*5.5]; // position of each line of text
    }
    if(curr_option == 'B'){ // if option B is selected then cover option A
        cover_y_pos = 195+txt_sz*6.0-1; 
        txt_line_y = [195+txt_sz*7.0, 195+txt_sz*8.0, 195+txt_sz*9.0]; // position of each line of text
    }

    // Define cover text

    // Display cover
    if(option_state >= 2 && option_state <= 7){
    }

    if(roll_state>0) { // roll animation is currently going
        
    }
    
    fill('#FFFFFFAA'); noStroke();
    rect(15, cover_y_pos, pw-2, cover_y_ht);

    // Display text
    textSize(txt_sz); noStroke(); textLeading(txt_sz); textAlign(LEFT);
    fill(txt_color);
    text(txt[0], txt_line_x[0], txt_line_y[0]);
    text(txt[1], txt_line_x[1], txt_line_y[1]);
    text(txt[2], txt_line_x[2], txt_line_y[2]);

    // Death screen
    if(option_state==10){
        is_roll = false; // prevent rolling
        //refresh_page = true; 
    }
}

function dsp_chpt_text(input_text){
    // Converts option a, success, failure, option b, success, failure text with stat names color changed

    var opt_a_type=0; var opt_b_type=0;                     // 1 = rolling (roll or combat), 0 = standard (item, inventory, continue) -> used to determine whether to display pass/fail
    let prompt_y_pos = 195;                                 // starting text position
    let prompt_x_pos = txt_sz/2;                            // " "
    let prompt_dx1 = txt_sz/2 * 2;                          // amount to shift x position for success/failure text
    let prompt_dx2 = prompt_dx1 + textWidth("SUCCESS: ");   // amount to shift text following above text
    let texts = [input_text[0].split(" "), input_text[1].split(" "), input_text[2].split(" "), input_text[3].split(" "), input_text[4].split(" "), input_text[5].split(" ")]
    let texts_wds = [0,0,0,0,0,0];                          // cumulative width of each text string

    // Determine if options are rolling type or not
    var curr_chpt = journey[chpt-10];
    if(curr_chpt.action_a_prompt[1] == 'Roll' || curr_chpt.action_a_prompt[1] == 'Combat'){
        opt_a_type = 1; 
    }
    if(curr_chpt.action_b_prompt[1] == 'Roll' || curr_chpt.action_b_prompt[1] == 'Combat'){
        opt_b_type = 1; 
    }

    for(let i=0; i<texts.length; i++){ // loop through each input string
        for(let j=0; j<texts[i].length; j++){ // loop through each word

            let wrd = texts[i][j]; // current word (includes surrounding characters)
            let wrd_txt = wrd.replace(/[^a-zA-Z]/g, ""); // remove surrounding characters that arent a-z or A-Z (regex)
            let is_stat; // 0 = not a stat, 1 = health, 2 = strength, 3 = wisdom, 4 = gold, 5 = inventory

            textSize(txt_sz); noStroke(); textLeading(txt_sz);

            let dy=0; // amount to shift text up/down (used to decrease spacing)
            if(i==0 || i==1 || i==2) { dy = -txt_sz/2; } // reduce spacing 
            if(i==3 || i==4 || i==5) { dy = -2*txt_sz/2; } // reduce spacing 

            // display success/failure
            fill(txt_color);
            if(j==0 && i==1 && num_options >= 1 && opt_a_type == 1){ text("SUCCESS: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+4) + dy); }
            if(j==0 && i==4 && num_options == 2 && opt_b_type == 1){ text("SUCCESS: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+5) + dy); }
            if(j==0 && i==2 && num_options >= 1 && opt_a_type == 1){ text("FAILURE: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+4) + dy); }
            if(j==0 && i==5 && num_options == 2 && opt_b_type == 1){ text("FAILURE: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+5) + dy); }
            
            if(wrd_txt.toUpperCase() == 'HEALTH'){          fill(stats_color[0]); is_stat = 1;}
            else if(wrd_txt.toUpperCase() == 'STRENGTH'){   fill(stats_color[1]); is_stat = 2;}
            else if(wrd_txt.toUpperCase() == 'WISDOM'){     fill(stats_color[2]); is_stat = 3;}
            else if(wrd_txt.toUpperCase() == 'GOLD'){       fill(stats_color[3]); is_stat = 4;}
            else if(wrd_txt.toUpperCase() == 'INVENTORY'){  fill(stats_color[4]); is_stat = 5;}
            else {                                          fill(txt_color);      is_stat = 0; }

            let dx = 0; // amount to shift text over
            if(i==1 || i==2 || i==4 || i==5) { dx = prompt_dx2; } // indent 

            if(is_stat > 0){ // stat word
                if(is_stat==1){ 
                    if(i<=2){ 
                        text("HEALTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( "HEALTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("HEALTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( "HEALTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                }
                if(is_stat==2){ 
                    if(i<=2){ 
                        text("STRENGTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( "STRENGTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(8) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(8) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("STRENGTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( "STRENGTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(8) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(8) + " " ); // update width count
                    }
                }
                if(is_stat==3){ 
                    if(i<=2){ 
                        text("WISDOM", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( "WISDOM" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("WISDOM", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( "WISDOM" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                }
                if(is_stat==4){ 
                    if(i<=2){ 
                        text("GOLD", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( "GOLD" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(4) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(4) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("GOLD", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( "GOLD" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(4) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(4) + " " ); // update width count
                    }
                }
                if(is_stat==5){ 
                    if(i<=2){ 
                        text("INVENTORY", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( "INVENTORY" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(9) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(9) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("INVENTORY", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( "INVENTORY" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(9) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy); 
                        texts_wds[i] += textWidth( wrd.slice(9) + " " ); // update width count
                    }
                }
            } 
            else { // normal word
                if(i<=2){ 
                    text(wrd + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) + dy);
                    texts_wds[i] += textWidth( wrd + " "); // update width count 
                }
                if(i> 2){ 
                    text(wrd + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) + dy);
                    texts_wds[i] += textWidth( wrd + " "); // update width count
                }
            }

        }
    }
}

function capitalize_first_word(text){
    // Capitalizes first word of string
    let text_split = text.split(" "); // split by spaces
    text_split[0] = text_split[0].toUpperCase(); // capitalize first word
    let new_text = join( text_split, " "); 
    return new_text;
}



function play_chpt(){
    // Main code to play each chapter (choose option, roll, etc.)

    print("roll result = " + roll_result + " , option state = " + option_state + ", health = " + player_curr_stats.health + ", roll speed = " + round(roll_speed));

    // Define current chapter and parameters
    var curr_chpt = journey[chpt-10]; 
    var roll_type; // used to call roll function

    // Determine if mouse has been clicked
    if(mouse_state[1] == 0 && mouse_state[0] == 1){ // mouse is not pressed in current frame but it was in last frame
        mouse_clicked = true; 
    } else {
        mouse_clicked = false; 
    }
    mouse_state[0] = mouse_state[1]; // set previous frame as current frame value 


    // Define bounds for cursor selection
    let num_inv = player_curr_stats.inventory_size; // number of inventory items
    // inventory bounds
    for(let i=0; i<num_inv; i++){ 
        inv_bounds[i] = [   inventory_xpos + i*(inventory_wd + inventory_sp), 
                            inventory_xpos + i*(inventory_wd + inventory_sp) + inventory_wd,
                            inventory_ypos,
                            inventory_ypos + inventory_wd
                        ];
    } 
    // option bounds
    var prompt_y_pos = 195; 
    option_a_bounds = [0, pw, prompt_y_pos + txt_sz*2.55, prompt_y_pos + txt_sz*2.55 + txt_sz*3.25];
    option_b_bounds = [0, pw, prompt_y_pos + txt_sz*6.05, prompt_y_pos + txt_sz*6.05 + txt_sz*3.25];


    // Select options
    if(mx >= option_a_bounds[0] && mx <= option_a_bounds[1] && my >= option_a_bounds[2] && my <= option_a_bounds[3] && option_state == 1 && mouse_clicked == true && curr_chpt.action_a_prompt[1] != 'None') {
        curr_option = 'A';
    }
    if(mx >= option_b_bounds[0] && mx <= option_b_bounds[1] && my >= option_b_bounds[2] && my <= option_b_bounds[3] && option_state == 1 && mouse_clicked == true && curr_chpt.action_b_prompt[1] != 'None') {
        curr_option = 'B';
    }

    // Perform option A functions
    if(curr_option == 'A'){
        if(curr_chpt.action_a_prompt[1] == 'Roll'){
            // Define roll parameters
            roll_type = 'Normal '; 
            if(curr_chpt.action_a_success[0]=='Item'){
                roll_type += 'Item';
            } else {
                roll_type += 'Continue';
            }
            // Run roll function
            roll(curr_chpt.action_a_prompt[2], curr_chpt.action_a_prompt[4], curr_chpt.action_a_prompt[5], roll_type); 

        }
        if(curr_chpt.action_a_prompt[1] == 'Combat'){
            // Define roll parameters
            roll_type = 'Combat '; 
            if(curr_chpt.action_a_success[0]=='Item'){
                roll_type += 'Item';
            } else {
                roll_type += 'Continue';
            }
            // Run roll function
            if(combat_reroll == false){
                roll(curr_chpt.action_a_prompt[2], curr_chpt.action_a_prompt[3], curr_chpt.action_a_prompt[5], roll_type); 
            }

        }
        if(curr_chpt.action_a_prompt[1] == 'Item'){

        }
        if(curr_chpt.action_a_prompt[1] == 'Stat'){
            // Update stats
            player_accm_stats.health    += curr_chpt.action_a_prompt[6][0];
            player_accm_stats.strength  += curr_chpt.action_a_prompt[6][1];
            player_accm_stats.wisdom    += curr_chpt.action_a_prompt[6][2];
            player_accm_stats.gold      += curr_chpt.action_a_prompt[6][3];
            player_accm_stats.inventory += curr_chpt.action_a_prompt[6][4]; 

            // Move to next chapter
            chpt += 1;             // go to next chapter
            option_state = 1;      // reset variables
            curr_option = 'Null';  // " "
            roll_result = -1;      // " "
            sum_rolls = 0;         // " "
            is_roll = true;        // " "
            combat_reroll = false; // " "
        }
        if(curr_chpt.action_a_prompt[1] == 'Continue'){
            // Move to next chapter
            chpt += 1;             // go to next chapter
            option_state = 1;      // reset variables
            curr_option = 'Null';  // " "
            roll_result = -1;      // " "
            sum_rolls = 0;         // " "
            is_roll = true;        // " "
            combat_reroll = false; // " "
        }
    }

    // Update stats after failed combat roll
    if(option_state==7 && mouse_clicked == true){ // 'tap anywehere to reroll' screen
        // Update stats and reroll
        if(curr_option=='A'){
            // Update stats
            player_accm_stats.health    += curr_chpt.action_a_failure[2][0];
            player_accm_stats.strength  += curr_chpt.action_a_failure[2][1];
            player_accm_stats.wisdom    += curr_chpt.action_a_failure[2][2];
            player_accm_stats.gold      += curr_chpt.action_a_failure[2][3];
            player_accm_stats.inventory += curr_chpt.action_a_failure[2][4]; 
            // Reroll
            combat_reroll = true; is_roll = true; 
            option_state = 0; // set to null state to prevent continuous stat changes
        }
        if(curr_option=='B'){
            // Update stats
            player_accm_stats.health    += curr_chpt.action_b_failure[2][0];
            player_accm_stats.strength  += curr_chpt.action_b_failure[2][1];
            player_accm_stats.wisdom    += curr_chpt.action_b_failure[2][2];
            player_accm_stats.gold      += curr_chpt.action_b_failure[2][3];
            player_accm_stats.inventory += curr_chpt.action_b_failure[2][4]; 
            // Reroll
            combat_reroll = true; is_roll = true; 
            option_state = 0; // set to null state to prevent continuous stat changes
        }
    }
    // Reroll after failed combat roll
    if(curr_option=='A' && combat_reroll==true){
        roll(curr_chpt.action_a_prompt[2], curr_chpt.action_a_prompt[3], curr_chpt.action_a_prompt[5], roll_type); 
    }
    if(curr_option=='B' && combat_reroll==true){
        roll(curr_chpt.action_b_prompt[2], curr_chpt.action_b_prompt[3], curr_chpt.action_b_prompt[5], roll_type); 
    }

    // Move to next chapter
    if(option_state==4 || option_state==5 || option_state==8){
        if(mouse_clicked == true){ // 'tap anywhere to continue' screen
            chpt += 1;             // go to next chapter
            option_state = 1;      // reset variables
            curr_option = 'Null';  // " "
            roll_result = -1;      // " "
            sum_rolls = 0;         // " "
            is_roll = true;        // " "
            combat_reroll = false; // " "
        }
    }
    

}

function roll(roll_stat, roll_min, roll_max, roll_type){
    // Shows roll animation and determines if player passes roll check
    // roll_stat = stat to roll
    // roll_min  = low bound for successful roll OR total sum for combat rolls
    // roll_max  = upper bound " "
    // roll_type = ['Normal Continue', 'Normal Item', 'Combat Continue', 'Combat Item']
    // Output -> updates roll_result and option_state

    //print("Roll Type = " + roll_type + ", Min/Max = " + roll_min + "/" + roll_max);

    // Set stat limit
    if(roll_stat == 'Health'){      stat_val = player_curr_stats.health;    crs_pos_y = 0; } 
    if(roll_stat == 'Strength'){    stat_val = player_curr_stats.strength;  crs_pos_y = 1; }
    if(roll_stat == 'Wisdom'){      stat_val = player_curr_stats.wisdom;    crs_pos_y = 2; }
    if(roll_stat == 'Gold'){        stat_val = player_curr_stats.gold;      crs_pos_y = 3; }
    
    // Define animation parameters
    var stat_val;             // value of player stat with added inventory boosters

    // Roll sequence
    if(is_roll){

        // Set animation variables
        if(roll_state == 0){
            roll_stop = round(  random( round(50/stat_val)*stat_val , round(50/stat_val)*stat_val + stat_val )  );  // final position occurs after >50 cursor movements, bounds set to ensure equal probability
            roll_slow = roll_stop - 12; // position to start slowing down cursor
        
            roll_speed = roll_speed_init;   // initialize roll speed
            start_frame = frameCount;       // animation starts at frame count
            prev_frame = frameCount;        // " "
            roll_state = 1;                // increase state parameter 
        }

        // Rolling animation
        if(roll_state == 1) {
            // Move cursor
            if(frameCount >= prev_frame + roll_speed) { // move cursor every n frames
                prev_frame += roll_speed;           // update last frame moved
                crs_pos_x += 1;                     // move cursor
                crs_tot_pos += 1;                   // update total movement amount
                if(crs_pos_x >= stat_val) { crs_pos_x = 0; } // loop back to beginning
            } 

            // Show cursor
            noFill(); stroke(txt_color); strokeWeight(1); // draw border
            rect(stat_x_pos + crs_pos_x*(stat_wd+3) - 1, txt_y_pos_0+(txt_spacing)*crs_pos_y + txt_sz/2 - 1, stat_wd+2, stat_ht+2); 
        
            // Slow down animation 
            if(crs_tot_pos >= roll_slow) {
                roll_speed += 0.22; 
            }
    
            // Stop animation
            if(crs_tot_pos == roll_stop) {
                roll_state = 2; // stop animation
            }
        
        }

        // Blink animation
        if(roll_state == 2){

            // Set blink frequency
            if(sin(frameCount*120) > 0 ) {
                stroke(txt_color); 
            } else {
                noStroke(); 
            }

            // Show cursor
            noFill(); strokeWeight(1); // draw border
            rect(stat_x_pos + crs_pos_x*(stat_wd+3) - 1, txt_y_pos_0+(txt_spacing)*crs_pos_y + txt_sz/2 - 1, stat_wd+2, stat_ht+2); 
        
            if(frameCount > prev_frame + 70) { // blink for n frames
                roll_state = 3; 
            }
        }

        // Display results
        if(roll_state == 3){
            // Return result
            roll_result = crs_pos_x+1; // return final roll value 
            roll_state = 4; // reset variables
        }


        // Reset
        if(roll_state == 4){
            // Reset variables
            is_roll = false; 
            combat_reoll=false;
            roll_speed = roll_speed_init;
            roll_state = 0;
            crs_pos_x = 0; 
            crs_tot_pos = 0; 
            // Set option state
            if( roll_result >= roll_min && roll_result <= roll_max ) { // successful roll
                if(roll_type == 'Normal Continue'){
                    option_state = 4; // continue after successful roll
                }
                if(roll_type == 'Normal Item'){
                    option_state = 6; // add item after successful roll

                }
            } 
            else { // unsuccessful roll
                if(roll_type == 'Normal Continue' || roll_type == 'Normal Item'){
                    option_state = 5; // continue after unsuccessful roll
                }
            }

            // Combat roll results
            if(roll_type == 'Combat Item' || roll_type == 'Combat Continue') {
                sum_rolls += roll_result; // add to roll

                // Base pass/fail calculations
                if(sum_rolls < roll_min) { // unsuccessful combat roll
                    option_state = 7; // reroll after unsuccessful roll                 
                }
                else { // successful combat roll
                    if(roll_type == 'Combat Item'){
                        option_state = 6; // add item after successful roll
                    }
                    if(roll_type == 'Combat Continue'){
                        option_state = 4; // continue after successful roll
                    }                    
                }

                // Edge cases
                // Compute stat change
                var curr_chpt = journey[chpt-10];
                var stat_change = [0,0,0,0,0]; // amount of change for player stats on unsuccessful roll
                if(curr_option == 'A') { stat_change = curr_chpt.action_a_failure[2]; }
                if(curr_option == 'B') { stat_change = curr_chpt.action_b_failure[2]; }
                var new_stats = [player_curr_stats.health + stat_change[0], player_curr_stats.strength + stat_change[1], player_curr_stats.wisdom + stat_change[2], player_curr_stats.gold + stat_change[3], player_curr_stats.inventory + stat_change[4]]; 
                if(new_stats[1] < 1 || new_stats[2] < 1 || new_stats[3] < 1 || new_stats[4] < 1){ // if any non-health stat becomes 0
                    option_state = 8; // continue after unsuccessful combat roll
                }

            }


        }

        if(roll_state == 1 || roll_state == 2 || roll_state == 3){
            // Hide instructions during roll
            option_state = 3;
        }

    }

}

function mousePressed(){
    // Update mouse state
    mouse_state[1] = 1; 
}

function mouseReleased(){
    // Update mouse state
    mouse_state[1] = 0; 
}



function inventory_update(){
    // Displays inventory items and applies stat changes

    // Display items
    var num_inv = player_curr_stats.inventory_size; // number of inventory items
    tint(img_fore); noFill(); noStroke();
    // Display inventory item images
    for(let i=0; i<num_inv; i++){
        if(inventory[i] >= 0){
            image(item_images[i], inventory_xpos + i*(inventory_wd + inventory_sp), inventory_ypos);
            fill(0); noStroke(); 
        }
    }

    // Draw borders around inventory
    noFill(); 
    stroke(txt_color); strokeWeight(1);
    for(let i=0; i<player_curr_stats.inventory_size; i++){
        rect(inventory_xpos + i*(inventory_wd + inventory_sp), inventory_ypos, inventory_wd, inventory_wd)
    }


    // Calculate stat change
    player_item_stats = {health: 0, strength: 0, wisdom: 0, gold: 0}; // change of player stats due to inventory items
    for(let i=0; i<num_inv; i++){
        if(inventory[i] >= 0){ // Add all items
            player_item_stats.health += items[i].health;
            player_item_stats.strength += items[i].strength;
            player_item_stats.wisdom += items[i].wisdom;
            player_item_stats.gold += items[i].gold;
        }
    }


    // Bound item stat change to prevent exceeding limits
    player_modf_stats.role      = player_base_stats.role; 
    player_modf_stats.health    = player_base_stats.health      + player_item_stats.health; 
    player_modf_stats.strength  = player_base_stats.strength    + player_item_stats.strength; 
    player_modf_stats.wisdom    = player_base_stats.wisdom      + player_item_stats.wisdom; 
    player_modf_stats.gold      = player_base_stats.gold        + player_item_stats.gold; 
    player_modf_stats.inventory_size = player_base_stats.inventory_size;
    
    if(player_modf_stats.health < 1)    { player_modf_stats.health = 1;     }
    if(player_modf_stats.health > 12)   { player_modf_stats.health = 12;    }    
    if(player_modf_stats.strength < 1)  { player_modf_stats.strength = 1;   }  
    if(player_modf_stats.strength > 12) { player_modf_stats.strength = 12;  }  
    if(player_modf_stats.wisdom < 1)    { player_modf_stats.wisdom = 1;     }  
    if(player_modf_stats.wisdom > 12)   { player_modf_stats.wisdom = 12;    }  
    if(player_modf_stats.gold < 1)      { player_modf_stats.gold = 1;       }  
    if(player_modf_stats.gold > 12)     { player_modf_stats.gold = 12;      }  


    // Update item stats with bounds to accurately show stat bars
    player_item_stats.health = player_modf_stats.health - player_base_stats.health;
    player_item_stats.strength = player_modf_stats.strength - player_base_stats.strength; 
    player_item_stats.wisdom = player_modf_stats.wisdom - player_base_stats.wisdom; 
    player_item_stats.gold = player_modf_stats.gold - player_base_stats.gold; 

    
    // Calculate current stats
    player_curr_stats.role              = player_modf_stats.role; 
    player_curr_stats.health            = player_modf_stats.health          + player_accm_stats.health; 
    player_curr_stats.strength          = player_modf_stats.strength        + player_accm_stats.strength; 
    player_curr_stats.wisdom            = player_modf_stats.wisdom          + player_accm_stats.wisdom; 
    player_curr_stats.gold              = player_modf_stats.gold            + player_accm_stats.gold; 
    player_curr_stats.inventory_size    = player_modf_stats.inventory_size  + player_accm_stats.inventory_size; 

    // Set bounds on non-health stats
    if(player_curr_stats.strength < 1) { player_curr_stats.strength  = 1; }
    if(player_curr_stats.wisdom < 1)   { player_curr_stats.wisdom    = 1; }
    if(player_curr_stats.gold < 1)     { player_curr_stats.gold      = 1; }
    if(player_curr_stats.inventory < 1){ player_curr_stats.inventory = 1; }


    // Death screen
    if(player_curr_stats.health < 1){
        option_state=10; // return to title screen
    }
}









// ======================================================================================================

const death_messages = [
    'It is not death that a man should fear, but he should fear never beginning to live. --Marcus Aurelius',
    'We are ever dying to one world and being born into another. --Henry David Thoreau'
];

const chpt_cards = [
    {
        id: 0,
        type: 'Null', 
        prompt: '',
        img: 'test.png',
        min_level: 0.00, 
        max_level: 1.00, 
        action_a_prompt: ['Description', 'Roll', 'Strength', 3, 99, 0, [1,0,0,0,0]],   
        action_a_success: ['Stat',0,[1,0,0,0,0],''],  
        action_a_failure: ['Stat',0,[-1,0,0,0,0],''], 
        action_b_prompt: ['Description', 'Roll', 'Strength', 3, 99, 0, [1,0,0,0,0]],     
        action_b_success: ['Stat',0,[1,0,0,0,0],''],            
        action_b_failure: ['Stat',0,[-1,0,0,0,0],''] 
    },
    {
        id: 0,          // ID to reference chapter card
        type: 'Normal', // Types: Normal, Boss (final boss fight), Null (template/example)
        prompt: 'Enter prompt text here, the first word of the prompt will be capitalized. The prompt should be around three lines long at most which is about the length of this prompt. ', // Paragraph (3 lines maximum) describing situation
        img: 'test.png', // Image file name, all images should be in chapter image folder. Image dimensions: 244px x 121px. 
        min_level: 0.00, // Allowable location of chapter in journey; e.g., min_level = 0.4 means player can only encounter this level at or after completing 40% of the max number of chapters
        max_level: 1.00, // " "
        action_a_prompt: ['Fight', 'Combat', 'Strength', 20, 3, 99, [0,1,0,0,0]], // Prompt text to take action A -> [Description, ['Roll' or 'Combat' or 'Item' or 'Stat' or 'Continue' or 'None'], Roll Stat, Combat Roll OR Item ID, Min Roll, Max Roll, Stat Change]. See notes document for more information and examples. 
        action_a_success: ['Continue',1,[2,0,0,0,0],''],                              // Success of action A -> [ ['Item','Stat','Continue','None'], ID of item, Stat change, Alt Text]. Alt text overrides default/autogenerated text.   
        action_a_failure: ['Stat',0,[-1,0,0,0,0],''],                             // Failure of action A, same formatting/inputs as above. 
        action_b_prompt: ['Read', 'Stat', 'Gold', 0, 3, 99, [0,0,1,0,0]],  // See action A 
        action_b_success: ['Item',0,[0,0,0,0,0],''],                              // " "
        action_b_failure: ['Stat',0,[-1,0,0,0,0],'']                              // " " 
    }
];