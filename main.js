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
const window_bkgd = '#1a1a1a';      // color around screen
const screen_bkgd = '#0f1b2c';      // game background color
const console_border = '#949494';   // border around game console
const txt_color = '#f2f2f2';        // main text color 
const stats_color = ['#821621','#204a99','#155e2d','#abad32']; // [health, strength, wisdom, gold] stat bar colors
const car_unpl_color = '#525252';   // color for unplayed cars/chapters for progress bar
const car_past_color = '#a3a3a3';   // color for past cars/chapters for progress bar

// Game State
const num_chpts = 10; // how many chapters to play
var chpt = 16;        // current chapter, see list below
var journey = [];     // list of chapter IDs for player's journey 
/*
0 = menu
1 = help/instructions
2 = about/credits
3 = character selection
10-## = game chapters
*/ 

// Player stats
var player_role = 0;                // index of player role to use
const roles = [
    {role: 'Prospector', health: 12, strength: 5, wisdom: 4, gold: 8, inventory_size: 4}
]
var player_base_stats = roles[0];   // default stats, to be changed during character selection
var player_curr_stats = roles[0];   // current stats (base + inventory + accumulated)
const max_stat = 12;                // maximum value any one stat can be

// Player inventory
var inventory = [
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
    {empty: true, id: 0, xmin: 0, xmax: 10, ymin: 0, ymax:10},
] // player inventory -> ID for items below, (xmin, xmax, ymin, ymax) for hit box for selecting inventory
const items = [
    {name: 'revolver', health: 1, strength: 0, wisdom: 0, gold: 0, img:'abc.png'},
    {name: 'glasses', health: 0, strength: -1, wisdom: 2, gold: 0, img:'abc.png'}
] // all collectible items
const inventory_xpos = 153; // px position to start inventory boxes
const inventory_ypos = 24; // " "
const inventory_wd = 21; // px size of each inventory box
const inventory_sp = 3; // px spacing between inventory boxes



function preload() {
    // Load all image files
    bkgd_img = loadImage('Images/bkgd.png'); 
    test_img = loadImage('Images/test.png'); 


    // Load fonts
    main_txt_font = loadFont('Fonts/Tiny5-Regular.ttf'); 

}



function setup() {
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
    var rnd_chpts = shuffle(chpt_cards_test); // randomize chapter order
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
    draw_background();
    draw_scale();
    draw_screen_bkgd();

    // Show GUI and template for chapters
    
    // Main code
    if(chpt==0){} // title/menu screen
    if(chpt==3){} // credits
    if(chpt>=10){ // play levels
        GUI();      // title bar information
        dsp_chpt(); // image and chapter
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
    let txt_spacing = 9; // pct of text size
    let txt_y_pos_0 = 10; // first stat y pos
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
    let stat_x_pos = 50;                                                                        // px x position of stat bar
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
    let stat_wd = 5; // px x width of stat bars
    let stat_ht = 5; // px y height of stat bars
    text(player_base_stats.role, stat_x_pos, txt_y_pos_0); // show player role

    // Health
    for(let j=0; j<player_base_stats.health; j++){ 
        fill(stats_color[0]); // fill color of stat bar
        stroke(stats_color[0]); strokeWeight(1); // draw border of same color
        rect(stat_x_pos + j*(stat_wd+3), txt_y_pos_0+(txt_spacing)*0 + txt_sz/2, stat_wd, stat_ht); 
        if(j==3){
            noFill(); // fill color of stat bar
            stroke(255); strokeWeight(1); // draw border of same color
            rect(stat_x_pos + j*(stat_wd+3) -1, txt_y_pos_0+(txt_spacing)*0 + txt_sz/2 - 1, stat_wd+2, stat_ht+2); 
        }
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
    image(test_img,6,title_y_pos,img_wd,img_ht);
    */
}



function dsp_chpt() {
    // Displays chapter image and prompt text

    // Drawing image
    let title_y_pos = 64; // bottom of title block
    tint(255,255); noFill(); noStroke();
    image(test_img,6,title_y_pos,img_wd,img_ht);

    // Image border
    noFill(); stroke(txt_color); strokeWeight(1); 
    rect(6,title_y_pos,img_wd,img_ht);
}



// ======================================================================================================

// All chapter cards are entered below -> ID = 0 is used as a template for reference and testing
const chpt_cards = [
    {
        id: 0, // ID to reference chapter card
        type: 'Normal', // Types: Normal (1 roll event), Combat (multi-roll event), Boss (final boss fight)
        prompt: 'Enter prompt text here', // Paragraph (3 lines maximum) describing situation
        img: 'abc.png', // Image file name, all images should be in image folder. See top of script for dimensions. 
        min_level: 0.00, // Allowable location of chapter in journey; e.g., min_level = 0.4 means player can only encounter this level at or after completing 40% of the max number of chapters
        max_level: 1.00, // " "
        number_actions: 2, // Either 1 or 2 different actions. If 1 is selected, data for action B will be ignored. 
        action_a_prompt: ['Fight', 'Roll', 'Strength', 3, 99], // Prompt text to take action A -> [Description, ['Roll' or 'Combat' or 'Item' or 'Continue'], Min Roll, Max Roll].   Example: "FIGHT. Roll a 3 or higher in STRENGTH."   OR   "ACCEPT. Add apple to inventory (+1 HEALTH)."   OR   ('Continue') "CONTINUE. Continue to next car."   OR   ('Combat') "FIGHT. Roll a total of 10 or higher in STRENGTH across all rolls."
        action_a_success: ['Item',1,[0,0,0,0,0],''], // Success of action A -> [ ['Item','Stat','Continue','None'], ID of item, Stat change, Alt Text]. Alt text overrides autogenerated text.   Example: ('Item') "Success: Add beer to inventory (+3 HEALTH, -2 WISDOM)"   OR   ('Stat') "Success: Increase +1 HEALTH. Increase +1 STRENGTH."   OR   ('Stat' + Alt Text) "Failure: Wake up deputy (-3 HEALTH)"   OR   ('Continue') "Success: Continue to next car." 
        action_a_failure: ['Stat',0,[-2,0,0,0,0],'Wake up deputy'], // Failure of action A (see above) -> Example: ('Normal' + 'Stat') "Failure: Decrease -1 HEALTH."   OR   ('Combat' + 'Stat') "Failure: Decrease -1 HEALTH each roll while in combat."  
        action_b_prompt: ['Fight', 'Combat', 'Strength', 3, 99], // See action A 
        action_b_success: ['Item',0,[0,0,0,0,0],''], // " "
        action_b_failure: ['Stat',0,[-2,0,0,0,0],''] // " " 
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