from flask import Flask, Response
import mysql.connector
import pandas as pd
import matplotlib.pyplot as plt
import io

# Disable interactive backend
import matplotlib
matplotlib.use('Agg')

app = Flask(__name__)

# Function to Get Data from MySQL
def get_game_data():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="bet_stats"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT player_id, total_bets, total_wins, total_losses, outcome FROM games")
    
    columns = ["player_id", "total_bets", "total_wins", "total_losses", "outcome"]
    df = pd.DataFrame(cursor.fetchall(), columns=columns)
    
    cursor.close()
    conn.close()
    return df

# Chart 1: Wins vs. Losses (Stacked Bar Chart)
@app.route("/chart/wins_losses")
def wins_losses_chart():
    df = get_game_data()
    
    plt.figure(figsize=(8, 5))
    df.groupby("player_id")[["total_wins", "total_losses"]].sum().plot(kind="bar", stacked=True)
    plt.title("Wins vs. Losses per Player")
    plt.xlabel("Player ID")
    plt.ylabel("Total Wins / Losses")
    plt.legend(["Wins", "Losses"])
    plt.grid(axis="y", linestyle="--", alpha=0.7)

    # Save the plot to a BytesIO object (to send image as response)
    img = io.BytesIO()
    plt.savefig(img, format="png")
    img.seek(0)

    # Clear the figure and close it to avoid memory issues
    plt.clf()
    plt.close()

    return Response(img.getvalue(), mimetype="image/png")

# Chart 2: Outcome Distribution (Histogram)
@app.route("/chart/outcome_distribution")
def outcome_distribution_chart():
    df = get_game_data()

    plt.figure(figsize=(8, 5))
    plt.hist(df["outcome"], bins=20, color="skyblue", edgecolor="black", alpha=0.7)
    plt.title("Game Outcome Distribution")
    plt.xlabel("Outcome (Gains/Losses)")
    plt.ylabel("Frequency")
    plt.grid(axis="y", linestyle="--", alpha=0.7)

    img = io.BytesIO()
    plt.savefig(img, format="png")
    img.seek(0)

    # Clear and close the figure
    plt.clf()
    plt.close()

    return Response(img.getvalue(), mimetype="image/png")

# Chart 3: Total Bets Per Player (Pie Chart)
@app.route("/chart/bets_pie_chart")
def bets_pie_chart():
    df = get_game_data()
    
    # Ensure 'total_bets' is numeric and handle errors (convert errors to NaN)
    df['total_bets'] = pd.to_numeric(df['total_bets'], errors='coerce')

    # Group by player_id and sum the total_bets for each player
    bets_per_player = df.groupby("player_id")["total_bets"].sum()

    # Debugging: Print the data to ensure it's valid
    print("Bets per Player Data:")
    print(bets_per_player)

    # Ensure there are no NaN values before plotting
    if bets_per_player.isnull().any() or bets_per_player.empty:
        return "No valid data available for bets per player.", 404

    # Plot the pie chart
    plt.figure(figsize=(7, 7))
    bets_per_player.plot(kind="pie", autopct='%1.1f%%', startangle=140, cmap="Set3", legend=False)
    plt.title("Total Bets Per Player")

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format="png")
    img.seek(0)

    # Clear and close the figure to free memory
    plt.clf()
    plt.close()

    return Response(img.getvalue(), mimetype="image/png")

if __name__ == "__main__":
    app.run(debug=True, port=5000)  # Run Flask on port 5000