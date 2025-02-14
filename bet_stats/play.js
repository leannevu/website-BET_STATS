 //callback for updating balance after every draw - database manipulation
 // make sure to update database correctly - games, number of bets, losses and wins, amount

var current_player_;
var current_player_id;
fetch_players();
//enableListClicks();
     
// Initialize the deck of cards (1 to 52)
const deck = [];
var in_game = false;
let rounds_played = 0;
let rounds_won = 0;
let rounds_lost = 0;
let total_bets = 0;
let outcome = 0;


document.addEventListener('DOMContentLoaded', function() {
    //Event listener for clicking on sprint backlog list
    const list = document.querySelector('#player-scroll-list');
    function handleClick(e) {
        // Check if the clicked element is a list item
        if (e.target && e.target.nodeName === "LI") {
            // Remove highlighted class from previously selected item
            const current = list.querySelector('.highlighted');
            if (current && current !== e.target) {
                current.classList.remove('highlighted');
            }
            // Toggle highlight class on the clicked item
            e.target.classList.toggle('highlighted');

            // Get the text content of the clicked list item
            current_player_ = e.target.textContent || e.target.innerText;
            personalize_game();
        }
    }
    list.addEventListener('click', handleClick);
    // Function to enable the event listener
    window.enableListClicks = function() {
        list.addEventListener('click', handleClick);
    };    
    // Function to disable the event listener
    window.disableListClicks = function() {
       list.removeEventListener('click', handleClick);
    };


});

function personalize_game() {
    //Personalize welcome
    document.querySelector(".introduction h2").innerHTML = "Welcome " + current_player_ + "!";
    fetch_current_balance();
    //Personalize balance
    //document.querySelector(".player-list p").innerHTML = "Balance: " + fetch_current_balance(current_player_);
}

function fetch_players() {
    $.ajax({
        url: 'database.php',
        type: 'POST',
        data: {
            action: 'fetch_players'
        },
        dataType: 'json',
        success: function(response) {
            //Parse the JSON response
            var htmlContent = '';

            //Loop through each student and create HTML content
            for (var i= 0; i < response.length; i++) {
                htmlContent += '<li>' + response[i].name + '</li>';
            }

            //Append the HTML content to the table body
            $('#player-scroll-list').html(htmlContent);

            //Click on the first list item //NOT WORKING...
            const firstListItem = document.querySelector('player-scroll-list li');
            if (firstListItem) {
                firstListItem.click(); // Simulate click on the first list item
            } 

        },
        error: function(xhr) {
            console.log("An error occured: " + xhr.status + " " + xhr.statusText);
        }
    });
}

function change_balance(result, amount_bet) {
    fetch_balance_cb(function(status) {
        let amount = parseInt(amount_bet);
        let new_balance;
        if (result == "lost") {
            new_balance = status - amount;
            $.ajax({
                url: 'database.php',
                type: 'POST',
                data: {
                    name: current_player_,
                    balance: new_balance,
                    action: 'manipulate_balance'
                },
                dataType: 'json',
                success: function(response) {
                    $('.player-list p').html("Balance: " + new_balance);
                },
                error: function(xhr) {
                    console.log(xhr)
                }
            });
        } 
        else {
            new_balance = parseInt(status) + (amount * 20);
            $.ajax({
                url: 'database.php',
                type: 'POST',
                data: {
                    name: current_player_,
                    balance: new_balance,
                    action: 'manipulate_balance'
                },
                dataType: 'json',
                success: function(response) {
                    $('.player-list p').html("Balance: " + new_balance);
                },
                error: function(xhr) {
        
                }
            });
        }
    

    });
}

function fetch_balance_cb(callback) {
    $.ajax({
        url: 'database.php',
        type: 'POST',
        data: {
            action: 'fetch_current_balance',
            name: current_player_
        },
        dataType: 'json',
        success: function(response) {
            if (response && response[0] && response[0].balance !== undefined) {
            callback(response[0].balance);
            }
        },
        error: function(xhr) {
            console.error("An error occurred: " + xhr.status + " " + xhr.statusText);
        }
    });
}

//calls everytime when new name is clicked - updates html using ajax
function fetch_current_balance() {
    $.ajax({
        url: 'database.php',
        type: 'POST',
        data: {
            action: 'fetch_current_balance',
            name: current_player_
        },
        dataType: 'json',
        success: function(response) {
            if (response && response[0] && response[0].balance !== undefined) {
                console.log("Current balance:", response[0].balance);
                $('.player-list p').html("Balance: " + response[0].balance);
                current_player_id = response[0].player_id;
            } else {
                console.error("Invalid response format or no data found:", response);
            }
        },
        error: function(xhr) {
            console.error("An error occurred: " + xhr.status + " " + xhr.statusText);
        }
    });
}


//clear cards; restart game
function clear_game() {
    const drawButton = document.getElementById("draw-button");
    drawButton.disabled = false;
    in_game = false;
    insertIntoGamesTable(total_bets, rounds_won, rounds_lost, outcome);


    document.getElementById('card1').src = "./cards/" + "joker" + '.jpg';
    document.getElementById('card2').src = "./cards/" + "joker2.png";
    document.getElementById("welcome-intro").innerHTML = "Welcome player!";
    enableListClicks();
}

function insertIntoGamesTable(bets, wins, losses, outcome) {
    console.log(current_player_id, bets, wins, losses);
    $.ajax({
        url: 'database.php',
        type: 'POST',
        data: {
            action: 'insert_into_games',
            total_bets: bets,
            total_wins: wins,
            total_losses: losses,
            player_id: current_player_id,
            outcome: outcome
        },
        dataType: 'json',
        success: function(response) {
            console.log(response);    
        },
        error: function(xhr) {
            console.error("AJAX Error:", xhr.responseText);
        }
    });

    rounds_played = 0;
    rounds_lost = 0;
    rounds_won = 0;
    total_bets = 0;
    outcome = 0;
}

//draw cards with game logistics
function draw() {

    if (in_game == true && deck.length == 0) { 
        document.getElementById("welcome-intro").innerHTML = current_player_ + ", there are no more cards to draw!";
        const drawButton = document.getElementById("draw-button");
        const clearButton = document.getElementById("clear-button");
        clearButton.disabled = false;
        drawButton.disabled = true;
        insertIntoGamesTable(total_bets, rounds_won, rounds_lost, outcome);
        in_game == false;

    } else {
        if (in_game == false) {
            for (let i = 1; i <= 52; i++) {
                deck.push(i);
            }
            in_game = true;
            
        }
        disableListClicks();
    shuffle(deck);
    const card1 = deck.pop();
    const card2 = deck.pop();
    document.getElementById('card1').src = "./cards/" + card1 + '.jpg';
    document.getElementById('card2').src = "./cards/" + card2 + '.jpg';

    const bet_amount_text = document.getElementById('bet-amount');
    let bet_amount = bet_amount_text.value;
    total_bets += parseInt(bet_amount);
    console.log("total bets: " + total_bets)

    if (card1 % 13 == card2 % 13) {
        document.getElementById("welcome-intro").innerHTML = current_player_ + ", you won!";
        change_balance("won", bet_amount);
        rounds_won++;
        outcome += parseInt(bet_amount) * 20;
    } else {
        document.getElementById("welcome-intro").innerHTML = current_player_ + ", you lost!";
        change_balance("lost", bet_amount);
        rounds_lost++;
        outcome -= parseInt(bet_amount);
    }

    rounds_played++;
    }
    
}

     // Shuffle the deck
     function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

   }



