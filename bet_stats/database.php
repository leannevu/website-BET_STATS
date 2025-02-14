<?php 
    $servername = "localhost";
    $username = "root";
    $password = "1234";
    $dbname = "bet_stats";

    //connect to database
    $conn = new mysqli($servername, $username, $password, $dbname);

    //If error occurs
    if ($conn->connect_errno) {
        error_log("Failed to connect to MySQL: " . $conn->connect_error); //Log error
        echo json_encode(['error ' => 'Database connection failed']);
        exit();
    }

    header('Content-Type: application/json'); // Set header to application/json

    $action = $_POST['action'];

    if ($action == 'fetch_players') {
        $sql = "SELECT * from players"; //create sql query 
        $stmt = $conn->prepare($sql); //prepare sql statement
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            $data = []; //create array variable (to return as json later)
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            } //copy results over to data array variable using fetch_assoc
            echo json_encode($data);
            exit();
        } else {
            error_log("SQL Error: " . $stmt->error);
            echo json_encode(['Error ' => 'Database query failed']);
            exit();
        }
        // Close statement
        $stmt->close();

    } else if ($action == 'fetch_current_balance') {
        $sql = "SELECT * from players WHERE name = ?";
        $stmt = $conn->prepare($sql);
    
        if (isset($_POST['name'])) {
            $name = $_POST['name'];
            $stmt->bind_param("s", $name);
        } else {
            echo json_encode(['Error' => 'Name parameter is missing']);
            exit();
        }
        // Close statement

        if ($stmt->execute()) {
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            if (empty($data)) {
                echo json_encode(['Error' => 'No results found']);
            } else {
                echo json_encode($data);
            }
            exit();
        } else {
            error_log("SQL Error: " . $stmt->error);
            echo json_encode(['Error' => 'Database query failed']);
            exit();
        }
        // Close statement
        $stmt->close();

    } else if($action == 'manipulate_balance') {
        if (isset($_POST['balance'])) {
            $balance = $_POST['balance'];
            $name = $_POST['name'];
        } 
        $sql = "UPDATE players SET balance = ?  WHERE name = ?";

        //Prepare the SQL statement
        $stmt = $conn->prepare($sql);
        // Bind parameters to the prepared statement
        $stmt->bind_param("ss", $balance, $name);

        // Execute the statement
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Record inserted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $stmt->error]);
        }
        // Close statement
        $stmt->close();
    } else if($action == 'insert_into_games') {
        // Ensure all required POST values exist
        $total_bets = $_POST['total_bets'] ?? 0;
        $total_wins = $_POST['total_wins'] ?? 0;
        $total_losses = $_POST['total_losses'] ?? 0;
        $player_id = $_POST['player_id'] ?? null;
        $outcome = $_POST['outcome'] ?? 0;

        $sql = "INSERT INTO games (total_bets, total_wins, total_losses, player_id, outcome) VALUES (?, ?, ?, ?, ?)";

        //Prepare the SQL statement
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            die(json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]));
        }

        // Bind parameters to the prepared statement
        $stmt->bind_param("sssss", $total_bets, $total_wins, $total_losses, $player_id, $outcome);
        // Execute the statement
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Record inserted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $stmt->error]);
        }
        // Close statement
        $stmt->close();

    }
    $conn->close();

?>

