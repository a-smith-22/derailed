/*
TITLE: Train Crawler
AUTHOR: Andrew Smith
DATE: 
UPDATES:
- 
*/



// General Options
var isMobile;       // determines whether device is mobile or desktop, used for mouseclick/touch detection

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
const img_bkgd = '#d6d9b4';         // color behind image
const stats_color = ['#821621','#204a99','#155e2d','#abad32', '#7133b8']; // [health, strength, wisdom, gold, inventory] stat colors
const car_unpl_color = '#525252';   // color for unplayed cars/chapters for progress bar
const car_past_color = '#a3a3a3';   // color for past cars/chapters for progress bar

// Game State
const num_chpts = 10; // how many chapters to play
var chpt = 10;        // current chapter, see list below
var journey = [];     // list of chapter IDs for player's journey 
var chpt_state = 0;   // 0 = show options/allow selection, 1 = 
/*
0 = menu
1 = help/instructions
2 = about/credits
3 = character selection
10-## = game chapters
*/ 

// Player stats
var player_role = 0; // index of player role to use
const roles = [
    {role: 'Prospector', health: 9,     strength: 6,    wisdom: 2,  gold: 8,    inventory_size: 3},
    {role: 'Outlaw',     health: 11,    strength: 9,    wisdom: 1,  gold: 2,    inventory_size: 3},
    {role: 'Lawyer',     health: 10,    strength: 1,    wisdom: 8,  gold: 6,    inventory_size: 4},
    {role: 'Banker',     health: 7,     strength: 3,    wisdom: 7,  gold: 12,   inventory_size: 3},
    {role: 'Barkeep',    health: 12,    strength: 5,    wisdom: 4,  gold: 8,    inventory_size: 4},
]
var player_base_stats = roles[0];   // default stats, to be changed during character selection
var player_curr_stats = roles[0];   // current stats (base + inventory + accumulated)
const max_stat = 12;                // maximum value any one stat can be
const stat_x_pos = 50;              // px x position of stat bar
const stat_wd = 5;                  // px x width of stat bars
const stat_ht = 5;                  // px y height of stat bars
const txt_spacing = 9;              // text spacing from top
const txt_y_pos_0 = 10;             // first stat y pos

// Player inventory
var inventory = [
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
] // player inventory -> ID for items below, (xmin, xmax, ymin, ymax) for hit box for selecting inventory
const items = [
    {name: 'revolver', health: 3, strength: 2, wisdom: 0, gold: 0, img:'abc.png'},
    {name: 'glasses', health: 0, strength: -1, wisdom: 2, gold: 0, img:'abc.png'}
] // all collectible items
const inventory_xpos = 153; // px position to start inventory boxes
const inventory_ypos = 24; // " "
const inventory_wd = 21; // px size of each inventory box
const inventory_sp = 3; // px spacing between inventory boxes

// Roll parameters
var is_roll = true;         // allows player to roll
var roll_result;            // value of roll
var roll_state = 0;         // 0 = no roll, 1 = rollinganimation, 2 = final blink, 3 = display result and reset
const roll_speed_init = 2;  // initial speed of roll in frames per cursor movement
var roll_speed;             // current speed of roll (see above)
var start_frame;            // frame animation started on 
var prev_frame = 0;         // frame cursor was last moved on
var crs_pos_x = 0;          // stat value cursor is currently hovering over
var crs_pos_y = 0;          // vertical value for stat cursor (health = 0, strength = 1, etc.) 
var crs_tot_pos = 0;        // total number of cursor movements, used to define animation sequence
var roll_slow, roll_stop;   // position to start slowing roll animation, position to stop animation 



function preload() {
    // Load all image files
    bkgd_img = loadImage('Images/bkgd.png'); 
    test_img = loadImage('Images/test.png'); 


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

        if(test_chpt.type != 'Boss' && i >= min_chpt && i <= max_chpt) { // chapter works in current journey slot
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
    var rnd_chpts = shuffle(chpt_cards_test); // reshuffle chapters
    for(let k=0; i <= rnd_chpts.length; k++){
        if(rnd_chpts[k].type == 'Boss'){ // check if boss chapter
            append(journey,rnd_chpts[k]);
            break;
        }
    }

    //print(journey);
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
    if(chpt==3){} // credits
    if(chpt>=10){ // play levels
        GUI();       // title bar information
        dsp_chpt();  // image and chapter text
        play_chpt(); // allows user selection and rolling
    } 

    // Display screen frame
    draw_frame();

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

    // Inventory
    fill(screen_bkgd); 
    stroke(txt_color); strokeWeight(1);
    for(let i=0; i<player_base_stats.inventory_size; i++){
        if(inventory[i]!=0){ // inventory slot is not empty
            // display image in box
        }
        rect(inventory_xpos + i*(inventory_wd + inventory_sp), inventory_ypos, inventory_wd, inventory_wd)
    }

    // Progress
    /*
    fill(txt_color); noStroke();
    textSize(txt_sz);
    textFont(main_txt_font);
    text('Progress', inventory_xpos, txt_y_pos_0 + txt_spacing*4);
    textAlign(CENTER);
    text(chpt-9 + ' of ' + num_chpts, inventory_xpos + 65, txt_y_pos_0 + txt_spacing*4);
    */
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

    // Player stats
    text(player_base_stats.role, stat_x_pos, txt_y_pos_0); // show player role

    // Health
    for(let j=0; j<player_base_stats.health; j++){ 
        fill(stats_color[0]); // fill color of stat bar
        stroke(stats_color[0]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*0 + txt_sz/2, stat_wd, stat_ht);
    }
    // Strength
    for(let j=0; j<player_base_stats.strength; j++){ 
        fill(stats_color[1]); // fill color of stat bar
        stroke(stats_color[1]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*1 + txt_sz/2, stat_wd, stat_ht); 
    }
    // Wisdom
    for(let j=0; j<player_base_stats.wisdom; j++){ 
        fill(stats_color[2]); // fill color of stat bar
        stroke(stats_color[2]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*2 + txt_sz/2, stat_wd, stat_ht); 
    }
    // Gold
    for(let j=0; j<player_base_stats.gold; j++){ 
        fill(stats_color[3]); // fill color of stat bar
        stroke(stats_color[3]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*3 + txt_sz/2, stat_wd, stat_ht); 
    }

    /*
    // Title block bar
    let title_y_pos = 62; // bottom of title block
    fill(txt_color); noStroke(); 
    //rect(0,title_y_pos,pw,1);

    // Image block bar
    let img_ht = 122; 
    fill(txt_color); noStroke(); 
    //rect(0,title_y_pos+img_ht,pw,1);
    */

    /*
    // EXAMPLE 
    textSize(8);
    noStroke();
    fill(txt_color);
    textLeading(txt_sz);
    text('YOU walk into a quiet train car with a sheriff asleep against the window. His hat covers his face and his gun is mounted in his hip holster. More text blah blah blah iaskdnas asod asodasnd.\n \nSTEAL. Roll a 3 or above in WISDOM.\n.          Success: Add gun to inventory (+4 STRENGTH)\n.          Failure: Lose 2 HEALTH.\n \nFIGHT. Roll a total of 5 or higher in STRENGTH across all rolls.\n.          Success: Continue to next car.\n.          Failure: Lose 3 HEALTH each roll while in combat.', txt_sz/2, 195, pw-txt_sz, ph);
    tint(255,255); noFill(); noStroke();
    //image(test_img,6,title_y_pos,img_wd,img_ht);
    */
}

function dsp_chpt() {
    // Displays chapter image and prompt text

    // Drawing image
    let title_y_pos = 64; // bottom of title block
    fill(img_bkgd); noStroke(); rect(6,title_y_pos,img_wd,img_ht); // background behind image
    tint(img_fore); noFill(); noStroke();
    image(test_img,6,title_y_pos,img_wd,img_ht);

    // Image border
    noFill(); stroke(txt_color); strokeWeight(1); 
    rect(6,title_y_pos,img_wd,img_ht);

    // Parse through text
    let curr_chpt = journey[chpt-10]; 
    let chpt_prompt = capitalize_first_word(curr_chpt.prompt);              // main chapter prompt, first paragraph
    let option_a_text = curr_chpt.action_a_prompt[0].toUpperCase() + ". ";  // full text for options a and b
    let option_b_text = curr_chpt.action_b_prompt[0].toUpperCase() + ". ";  // " "
    let option_as_text = ""; let option_af_text = "";                       // option a/b success/failure outcomes
    let option_bs_text = ""; let option_bf_text = "";                       // " "


    // Write option A text
    if(curr_chpt.action_a_prompt[1] == 'Roll'){
        if(curr_chpt.action_a_prompt[3] == 0) {
            option_a_text += "Roll a " + curr_chpt.action_a_prompt[4] + " or less in " + curr_chpt.action_a_prompt[2].toUpperCase() + ".";
        } 
        else {
            option_a_text += "Roll a " + curr_chpt.action_a_prompt[3] + " or above in " + curr_chpt.action_a_prompt[2].toUpperCase() + ".";
        } 
    }
    if(curr_chpt.action_a_prompt[1] == 'Combat'){
        option_a_text += "Roll a total of " + curr_chpt.action_a_prompt[3] + " in " + curr_chpt.action_a_prompt[2].toUpperCase() + " across all rolls.";
    }
    if(curr_chpt.action_a_prompt[1] == 'Item'){
        let item = items[curr_chpt.action_a_prompt[5]];
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


    // Write option B text
    if(curr_chpt.action_b_prompt[1] == 'Roll'){
        if(curr_chpt.action_b_prompt[3] == 0) {
            option_b_text += "Roll a " + curr_chpt.action_b_prompt[4] + " or less in " + curr_chpt.action_b_prompt[2].toUpperCase() + ".";
        } 
        else {
            option_b_text += "Roll a " + curr_chpt.action_b_prompt[3] + " or above in " + curr_chpt.action_b_prompt[2].toUpperCase() + ".";
        } 
    }
    if(curr_chpt.action_b_prompt[1] == 'Combat'){
        option_b_text += "Roll a total of " + curr_chpt.action_b_prompt[3] + " in " + curr_chpt.action_b_prompt[2].toUpperCase() + " across all rolls.";
    }
    if(curr_chpt.action_b_prompt[1] == 'Item'){
        let item = items[curr_chpt.action_b_prompt[5]];
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
            if(curr_chpt.action_a_success[2][0] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][0]) + " HEALTH."; } if(curr_chpt.action_a_success[2][0] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][0]) + " HEALTH."; }
            if(curr_chpt.action_a_success[2][1] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][1]) + " STRENGTH."; } if(curr_chpt.action_a_success[2][1] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][1]) + " STRENGTH."; }
            if(curr_chpt.action_a_success[2][2] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][2]) + " WISDOM."; } if(curr_chpt.action_a_success[2][2] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][2]) + " WISDOM."; }
            if(curr_chpt.action_a_success[2][3] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][3]) + " GOLD."; } if(curr_chpt.action_a_success[2][3] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][3]) + " GOLD."; }
            if(curr_chpt.action_a_success[2][4] > 0){ option_as_text += "Increase +" + abs(curr_chpt.action_a_success[2][4]) + " INVENTORY."; } if(curr_chpt.action_a_success[2][4] < 0){ option_as_text += "Decrease -" + abs(curr_chpt.action_a_success[2][4]) + " INVENTORY."; }
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
            if(curr_chpt.action_a_failure[2][0] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH."; } if(curr_chpt.action_a_failure[2][0] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH."; }
            if(curr_chpt.action_a_failure[2][1] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH."; } if(curr_chpt.action_a_failure[2][1] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH."; }
            if(curr_chpt.action_a_failure[2][2] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM."; } if(curr_chpt.action_a_failure[2][2] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM."; }
            if(curr_chpt.action_a_failure[2][3] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD."; } if(curr_chpt.action_a_failure[2][3] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD."; }
            if(curr_chpt.action_a_failure[2][4] > 0){ option_af_text += "Increase +" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY."; } if(curr_chpt.action_a_failure[2][4] < 0){ option_af_text += "Decrease -" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY."; }
        }
        if(curr_chpt.action_a_failure[3] != ''){ // alt text, assume only one stat change
            option_af_text += curr_chpt.action_a_failure[3];
            if(curr_chpt.action_a_failure[2][0] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH)."} if(curr_chpt.action_a_failure[2][0] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][0]) + " HEALTH)."}
            if(curr_chpt.action_a_failure[2][1] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH)."} if(curr_chpt.action_a_failure[2][1] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][1]) + " STRENGTH)."}
            if(curr_chpt.action_a_failure[2][2] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM)."} if(curr_chpt.action_a_failure[2][2] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][2]) + " WISDOM)."}
            if(curr_chpt.action_a_failure[2][3] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD)."} if(curr_chpt.action_a_failure[2][3] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][3]) + " GOLD)."}
            if(curr_chpt.action_a_failure[2][4] > 0){ option_af_text += " (+" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY)."} if(curr_chpt.action_a_failure[2][4] < 0){ option_af_text += " (-" + abs(curr_chpt.action_a_failure[2][4]) + " INVENTORY)."}
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
            if(curr_chpt.action_b_success[2][0] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][0]) + " HEALTH."; } if(curr_chpt.action_b_success[2][0] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][0]) + " HEALTH."; }
            if(curr_chpt.action_b_success[2][1] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][1]) + " STRENGTH."; } if(curr_chpt.action_b_success[2][1] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][1]) + " STRENGTH."; }
            if(curr_chpt.action_b_success[2][2] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][2]) + " WISDOM."; } if(curr_chpt.action_b_success[2][2] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][2]) + " WISDOM."; }
            if(curr_chpt.action_b_success[2][3] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][3]) + " GOLD."; } if(curr_chpt.action_b_success[2][3] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][3]) + " GOLD."; }
            if(curr_chpt.action_b_success[2][4] > 0){ option_bs_text += "Increase +" + abs(curr_chpt.action_b_success[2][4]) + " INVENTORY."; } if(curr_chpt.action_b_success[2][4] < 0){ option_bs_text += "Decrease -" + abs(curr_chpt.action_b_success[2][4]) + " INVENTORY."; }
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
            if(curr_chpt.action_b_failure[2][0] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH."; } if(curr_chpt.action_b_failure[2][0] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH."; }
            if(curr_chpt.action_b_failure[2][1] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH."; } if(curr_chpt.action_b_failure[2][1] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH."; }
            if(curr_chpt.action_b_failure[2][2] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM."; } if(curr_chpt.action_b_failure[2][2] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM."; }
            if(curr_chpt.action_b_failure[2][3] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD."; } if(curr_chpt.action_b_failure[2][3] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD."; }
            if(curr_chpt.action_b_failure[2][4] > 0){ option_bf_text += "Increase +" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY."; } if(curr_chpt.action_b_failure[2][4] < 0){ option_bf_text += "Decrease -" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY."; }
        }
        if(curr_chpt.action_b_failure[3] != ''){ // alt text, assume only one stat change
            option_bf_text += curr_chpt.action_b_failure[3];
            if(curr_chpt.action_b_failure[2][0] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH)."} if(curr_chpt.action_b_failure[2][0] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][0]) + " HEALTH)."}
            if(curr_chpt.action_b_failure[2][1] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH)."} if(curr_chpt.action_b_failure[2][1] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][1]) + " STRENGTH)."}
            if(curr_chpt.action_b_failure[2][2] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM)."} if(curr_chpt.action_b_failure[2][2] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][2]) + " WISDOM)."}
            if(curr_chpt.action_b_failure[2][3] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD)."} if(curr_chpt.action_b_failure[2][3] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][3]) + " GOLD)."}
            if(curr_chpt.action_b_failure[2][4] > 0){ option_bf_text += " (+" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY)."} if(curr_chpt.action_b_failure[2][4] < 0){ option_bf_text += " (-" + abs(curr_chpt.action_b_failure[2][4]) + " INVENTORY)."}
        }
    }
    if(curr_chpt.action_b_failure[0] == 'Continue'){
        option_bf_text += "Continue to the next car.";
    }
    if(curr_chpt.action_b_failure[0] == 'None'){
        option_bf_text += ""; // empty prompt
    }


    // Show bars behind options


    // Display prompt and options
    let prompt_y_pos = 195; 
    textSize(txt_sz); noStroke(); textLeading(txt_sz);
    fill(txt_color);
    text(chpt_prompt, txt_sz/2, prompt_y_pos, pw-txt_sz, ph);

    dsp_chpt_text([option_a_text, option_as_text, option_af_text, option_b_text, option_bs_text, option_bf_text]); // display options with stat names color changed

    /*
    // Display option and success/failure text (debugging)
    text(option_a_text, txt_sz/2, prompt_y_pos+4*txt_sz, pw-txt_sz, ph);
    text(option_as_text, txt_sz*2, prompt_y_pos+5*txt_sz, pw-txt_sz, ph);
    text(option_af_text, txt_sz*2, prompt_y_pos+6*txt_sz, pw-txt_sz, ph);
    text(option_b_text, txt_sz/2, prompt_y_pos+8*txt_sz, pw-txt_sz, ph);
    text(option_bs_text, txt_sz*2, prompt_y_pos+9*txt_sz, pw-txt_sz, ph);
    text(option_bf_text, txt_sz*2, prompt_y_pos+10*txt_sz, pw-txt_sz, ph);
    */

}

function dsp_chpt_text(input_text){
    // Converts option a, success, failure, option b, success, failure text with stat names color changed

    let prompt_y_pos = 195;                                 // starting text position
    let prompt_x_pos = txt_sz/2;                            // " "
    let prompt_dx1 = txt_sz/2 * 2;                          // amount to shift x position for success/failure text
    let prompt_dx2 = prompt_dx1 + textWidth("SUCCESS: ");   // amount to shift text following above text
    let text_pos_y0 = prompt_y_pos + 4*txt_sz;              // y position of first position
    let texts = [input_text[0].split(" "), input_text[1].split(" "), input_text[2].split(" "), input_text[3].split(" "), input_text[4].split(" "), input_text[5].split(" ")]
    let texts_wds = [0,0,0,0,0,0];                          // cumulative width of each text string

    for(let i=0; i<texts.length; i++){ // loop through each input string
        for(let j=0; j<texts[i].length; j++){ // loop through each word

            let wrd = texts[i][j]; // current word (includes surrounding characters)
            let wrd_txt = wrd.replace(/[^a-zA-Z]/g, ""); // remove surrounding characters that arent a-z or A-Z (regex)
            print(wrd_txt);
            let is_stat; // 0 = not a stat, 1 = health, 2 = strength, 3 = wisdom, 4 = gold, 5 = inventory

            textSize(txt_sz); noStroke(); textLeading(txt_sz);

            // display success/failure
            fill(txt_color);
            if(j==0 && i==1){ text("SUCCESS: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+4) ); }
            if(j==0 && i==4){ text("SUCCESS: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+5) ); }
            if(j==0 && i==2){ text("FAILURE: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+4) ); }
            if(j==0 && i==5){ text("FAILURE: ", prompt_x_pos + texts_wds[i] + prompt_dx1, prompt_y_pos + txt_sz*(i+5) ); }
            
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
                        text("HEALTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( "HEALTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("HEALTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( "HEALTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                }
                if(is_stat==2){ 
                    if(i<=2){ 
                        text("STRENGTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( "STRENGTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(8) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( wrd.slice(8) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("STRENGTH", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( "STRENGTH" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(8) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( wrd.slice(8) + " " ); // update width count
                    }
                }
                if(is_stat==3){ 
                    if(i<=2){ 
                        text("WISDOM", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( "WISDOM" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("WISDOM", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( "WISDOM" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(6) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( wrd.slice(6) + " " ); // update width count
                    }
                }
                if(is_stat==4){ 
                    if(i<=2){ 
                        text("GOLD", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( "GOLD" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(4) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( wrd.slice(4) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("GOLD", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( "GOLD" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(4) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( wrd.slice(4) + " " ); // update width count
                    }
                }
                if(is_stat==5){ 
                    if(i<=2){ 
                        text("INVENTORY", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( "INVENTORY" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(9) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) ); 
                        texts_wds[i] += textWidth( wrd.slice(9) + " " ); // update width count
                    }
                    if(i> 2){ 
                        text("INVENTORY", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( "INVENTORY" ); // update width count
                        fill(txt_color); 
                        text(wrd.slice(9) + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) ); 
                        texts_wds[i] += textWidth( wrd.slice(9) + " " ); // update width count
                    }
                }
            } 
            else { // normal word
                if(i<=2){ 
                    text(wrd + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+4) );
                    texts_wds[i] += textWidth( wrd + " "); // update width count 
                }
                if(i> 2){ 
                    text(wrd + " ", prompt_x_pos + texts_wds[i] + dx, prompt_y_pos + txt_sz*(i+5) );
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

    // Allow player to select option
    if(chpt_state==0){ 

    }

}


function roll(roll_stat){
    // Shows roll animation and determines if player passes roll check

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
            roll_state += 1;                // increase state parameter 
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
            rect(stat_x_pos + crs_pos_x*(stat_wd+3) -1, txt_y_pos_0+(txt_spacing)*crs_pos_y + txt_sz/2 - 1, stat_wd+2, stat_ht+2); 
        
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
            rect(stat_x_pos + crs_pos_x*(stat_wd+3) -1, txt_y_pos_0+(txt_spacing)*crs_pos_y + txt_sz/2 - 1, stat_wd+2, stat_ht+2); 
        
            if(frameCount > prev_frame + 70) { // blink for n frames
                roll_state = 3; 
            }
        }

        // Show results and reset
        if(roll_state == 3){
            // Reset variables
            is_roll = false; 
            roll_state = 0;
            crs_pos_x = 0; 
            crs_tot_pos = 0; 

            // Return result
            roll_result = crs_pos_x+1; // return final roll value 
        }



    }

}






// ======================================================================================================

// All chapter cards are entered below -> ID = 0 is used as a template for reference and testing
const chpt_cards = [
    {
        id: 0, // ID to reference chapter card
        type: 'Null', // Types: Normal (1 roll event), Combat (multi-roll event), Boss (final boss fight), Null (template)
        prompt: 'Enter prompt text here, the first word of the prompt will be capitalized. The prompt should be around three lines long at most which is about the length of this prompt. ', // Paragraph (3 lines maximum) describing situation
        img: 'abc.png', // Image file name, all images should be in image folder. See top of script for dimensions. 
        min_level: 0.00, // Allowable location of chapter in journey; e.g., min_level = 0.4 means player can only encounter this level at or after completing 40% of the max number of chapters
        max_level: 1.00, // " "
        number_actions: 2, // Either 1 or 2 different actions. If 1 is selected, data for action B will be ignored. 
        action_a_prompt: ['Steal', 'Item', 'Strength', 3, 99, 0],   // Prompt text to take action A -> [Description, ['Roll' or 'Combat' or 'Item' or 'Continue'], Roll Stat, Min Roll, Max Roll, Item ID].   Example: ('Roll') "FIGHT. Roll a 3 or higher in STRENGTH."   OR   ('Item') "ACCEPT. Add apple to inventory (+1 HEALTH)."   OR   ('Continue') "CONTINUE. Continue to next car."   OR   ('Combat') "FIGHT. Roll a total of 10 or higher in STRENGTH across all rolls."
        action_a_success: ['Stat',1,[2,0,0,0,0],'Go super siyan'],                // Success of action A -> [ ['Item','Stat','Continue','None'], ID of item, Stat change, Alt Text]. Alt text overrides autogenerated text.   Example: ('Item') "Success: Add beer to inventory (+3 HEALTH, -2 WISDOM)"   OR   ('Stat') "Success: Increase +1 HEALTH. Increase +1 STRENGTH."   OR   ('Stat' + Alt Text) "Failure: Wake up deputy (-3 HEALTH)"   OR   ('Continue') "Success: Continue to next car." 
        action_a_failure: ['Stat',0,[-2,0,0,0,0],'Wake up deputy'], // Failure of action A (see above) -> Example: ('Normal' + 'Stat') "Failure: Decrease -1 HEALTH."   OR   ('Combat' + 'Stat') "Failure: Decrease -1 HEALTH each roll while in combat."  
        action_b_prompt: ['Fight', 'Item', 'Strength', 3, 99, 0], // See action A 
        action_b_success: ['Item',0,[0,0,0,0,0],''],                // " "
        action_b_failure: ['Stat',0,[-2,0,0,0,0],'']                // " " 
    }
]

const chpt_cards_test = [
    {id: 0, type:'Normal', min_level:0.00, max_level:0.40},
    {id: 1, type:'Normal', min_level:0.10, max_level:0.80},
    {id: 2, type:'Normal', min_level:0.50, max_level:0.60},
    {id: 3, type:'Normal', min_level:0.60, max_level:1.00},
    {id: 4, type:'Normal', min_level:0.20, max_level:0.70},
    {id: 5, type:'Normal', min_level:0.00, max_level:0.30},
    {id: 6, type:'Normal', min_level:0.00, max_level:0.40},
    {id: 7, type:'Normal', min_level:0.40, max_level:0.50},
    {id: 8, type:'Normal', min_level:0.00, max_level:1.00},
    {id: 9, type:'Boss', min_level:0.00, max_level:1.00},
    {id: 10, type:'Normal', min_level:0.00, max_level:0.10},
    {id: 11, type:'Normal', min_level:0.30, max_level:0.60},
    {id: 13, type:'Normal', min_level:0.70, max_level:0.80},
    {id: 14, type:'Normal', min_level:0.40, max_level:0.50},
    {id: 15, type:'Normal', min_level:0.00, max_level:1.00},
    {id: 16, type:'Normal', min_level:0.60, max_level:0.90},
    {id: 17, type:'Normal', min_level:0.00, max_level:1.00},
]