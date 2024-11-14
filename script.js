// Establish a socket connection to the server
const socket = io(); // This assumes the server is running and serving Socket.IO
// Listen for "bookingWait" to display the "Please wait" message
socket.on("bookingWait", (data) => {
    alert(data.message);
});

// Function to add a user to the queue by sending a POST request
function joinQueue() {
    const username = document.getElementById("username").value.trim();
    
    // Validate that the username is not empty
    if (username === "") {
        alert("Please enter a name.");
        return;
    }

    // Send a POST request to add the user to the queue
    fetch("/api/queue", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
    })
    .then(response => response.json())
    .then(data => {
       if (data.message === "Someone is booking, please wait.") {
            document.getElementById("status").textContent = data.message;
            setTimeout(() => {
                // Retry after a short delay (e.g., 2 seconds)
                joinQueue();
            }, 2000); // Retry after 2 seconds
        } else {
            updateQueue(data.queue);   // Update the queue UI with the new queue
            document.getElementById("status").textContent = "You have been added to the queue.";
        }
    })
    .catch(error => {
        console.error("Error adding user to queue:", error);
    });
}

function dequeueFan() {
    fetch('/api/dequeue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Update the queue display with the updated data from the server
        updateQueue(data.queue);
        // Optionally, update status message
        document.getElementById("status").textContent = data.message || "Processed the next fan";
    })
    .catch(error => {
        console.error('Error processing next fan:', error);
        document.getElementById("status").textContent = "Error processing the next fan";
    });
}

// Function to update the queue on the UI
function updateQueue(queue) {
    const queueList = document.getElementById("queueList");
    queueList.innerHTML = ""; // Clear the existing list

    // Populate the queue with each user in the queue
    queue.forEach(user => {
        const listItem = document.createElement("li");
        listItem.textContent = `${user.username} - ${new Date(user.joinedAt).toLocaleString()}`;
        queueList.appendChild(listItem);
    });
}

// Listen for real-time updates from the server via Socket.IO
socket.on("queueUpdate", (updatedQueue) => {
    updateQueue(updatedQueue); // Update the UI with the new queue data
});

// Fetch the current queue status when the page is loaded
window.onload = () => {
    fetch("/api/queue")
        .then(response => response.json())
        .then(data => updateQueue(data)) // Update the UI with the current queue
        .catch(error => console.error("Error fetching queue:", error));
};

