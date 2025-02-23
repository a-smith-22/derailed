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
var w_win, h_win;               // window dimensions
const pw = 256; const ph = 240; // game pixel dimensions (pixel blocks)
const pad_win = 0.1;            // scale game to either width or height with 10% padding
var scl;                        // number of window pixels per game pixel
const txt_sz = 8;               // size of main game text

// Color Pallette
const window_bkgd = '#1a1a1a';    // color around screen
const screen_bkgd = '#0f1b2c';    // game background color
const console_border = '#949494'; // border around game console
const txt_color = '#f2f2f2';      // main text color 
const stats_color = ['#821621','#204a99','#155e2d','#abad32']; // [health, strength, wisdom, gold] stat bar colors

// Game State
const num_chpts = 10; // how many chapters to play
var chpt = 10;      // current chapter, see list below
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
    {role: 'Deputy', health: 12, strength: 6, wisdom: 2, gold: 4, inventory_size: 4}
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
const inventory_ypos = 15; // " "
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
    GUI(); 
    
    // Main code
    if(chpt==0){} // title/menu screen
    if(chpt==3){} // credits
    if(chpt>=10){} // play levels

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

    // Inventory title
    let txt_spacing = 9; // pct of text size
    let txt_y_pos_0 = 10; // first stat y pos
    fill(txt_color); noStroke();
    textSize(txt_sz); textAlign(LEFT);
    textFont(main_txt_font);
    text('Inventory', inventory_xpos, txt_y_pos_0);

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
    fill(txt_color); noStroke();
    textSize(txt_sz);
    textFont(main_txt_font);
    text('Progress', inventory_xpos, txt_y_pos_0 + txt_spacing*4);
    textAlign(CENTER);
    text(chpt-9 + ' of ' + num_chpts, inventory_xpos + 65, txt_y_pos_0 + txt_spacing*4);

    // Player stat titles
    fill(txt_color); noStroke();
    textSize(txt_sz); textAlign(LEFT);
    textFont(main_txt_font);
    text('Role', txt_sz/2,     txt_y_pos_0);
    text('Health', txt_sz/2,   txt_y_pos_0 + txt_spacing*1);
    text('Strength', txt_sz/2, txt_y_pos_0 + txt_spacing*2);
    text('Wisdom', txt_sz/2,   txt_y_pos_0 + txt_spacing*3);
    text('Gold', txt_sz/2,     txt_y_pos_0 + txt_spacing*4);

    // Player stats
    let stat_x_pos = 50; // px x position of stat bar
    let stat_wd = 5; // px x width of stat bars
    let stat_ht = 5; // px y height of stat bars
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

    // Title block bar
    let title_y_pos = 50; // bottom of title block
    fill(txt_color); noStroke(); 
    rect(0,title_y_pos,pw,1);

    // Image block bar
    let img_ht = 104; 
    fill(txt_color); noStroke(); 
    rect(0,title_y_pos+img_ht,pw,1);

    textSize(8);
    noStroke();
    fill(txt_color);
    textLeading(txt_sz);
    //text('YOU walk into a quiet train car with a sheriff asleep against the window. His hat covers his face and his gun is mounted in his hip holster.\nSTEAL. Roll a 3 or above in WISDOM.\n.     Success: Add gun to inventory (+4 STRENGTH)\n.     Failure: Lose 2 HEALTH.\nSHOOT HIM. Roll a 3 or above in STRENGTH.\n.     Success\n.     Failure', 5, 160, pw-10, 100);
    text('YOU walk into a quiet train car with a sheriff asleep against the window. His hat covers his face and his gun is mounted in his hip holster.', 5, 164, pw-10, 100);
    text('STEAL. Roll 5 or higher in WISDOM.', 5, 191, pw-10, 100);
    text('.        Sucess: Add revolver to inventory (+5 STRENGTH).', 5, 199, pw-10, 100);
    text('.        Failure. Lose 3 HEALTH.', 5, 207, pw-10, 100);
    text('STEAL. Roll 5 or higher in WISDOM.', 5, 218, pw-10, 100);
    text('.        Sucess: Add revolver to inventory (+5 STRENGTH).', 5, 226, pw-10, 100);
    text('.        Failure. Lose 3 HEALTH.', 5, 234, pw-10, 100);

    tint(255,255); noFill(); noStroke();
    image(test_img,0,title_y_pos,pw,img_ht);

}