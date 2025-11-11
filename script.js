// Wait for the DOM (the HTML page) to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Global variables ---
    let allData; // This will store our loaded f1_data.json
    const summaryTableContainer = document.getElementById('summary-table-container');
    const seasonTableContainer = document.getElementById('season-table-container');
    const seasonSelect = document.getElementById('season-select');

    // --- Main function to fetch data and initialize the page ---
    async function init() {
        try {
            const response = await fetch('f1_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            allData = await response.json();
            
            // Once data is loaded, build the page
            populateSummaryTable();
            populateSeasonSelector();
            populateSeasonTable(seasonSelect.value); // Load the default season
            
        } catch (error) {
            console.error("Could not load data:", error);
            summaryTableContainer.innerHTML = "<p>Error: Could not load data.json. Make sure the file is in the same folder.</p>";
        }
    }

    // --- 1. Populate the ELO Summary Table ---
    function populateSummaryTable() {
        const summaryData = allData.summary;
        if (!summaryData) return;

        let html = '<table>';
        // Create headers
        html += '<thead><tr><th>Driver</th><th>2024 Avg</th><th>2025 Avg</th><th>ELO</th></tr></thead>';
        // Create body
        html += '<tbody>';
        summaryData.forEach(driver => {
            html += `
                <tr>
                    <td>${driver.Driver}</td>
                    <td>${driver['2024 Season Average']}</td>
                    <td>${driver['2025 Season Average']}</td>
                    <td>${driver.ELO}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        summaryTableContainer.innerHTML = html;
    }

    // --- 2. Fill the <select> dropdown with seasons ---
    function populateSeasonSelector() {
        const seasons = Object.keys(allData.seasons).sort().reverse(); // e.g., ["2025", "2024"]
        seasons.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            seasonSelect.appendChild(option);
        });
        
        // Add an event listener to update the table when the user changes the selection
        seasonSelect.addEventListener('change', (e) => {
            populateSeasonTable(e.target.value);
        });
    }

    // --- 3. Populate the Season-Specific Table ---
    function populateSeasonTable(year) {
        const seasonData = allData.seasons[year];
        if (!seasonData || seasonData.length === 0) {
            seasonTableContainer.innerHTML = `<p>No data available for ${year}.</p>`;
            return;
        }

        // Get all headers dynamically from the first driver
        // This makes your code robust if you add/remove races!
        const headers = Object.keys(seasonData[0]);

        let html = '<table>';
        // Create headers
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead>';

        // Create body
        html += '<tbody>';
        seasonData.forEach(driver => {
            html += '<tr>';
            headers.forEach(header => {
                // Use (driver[header] ?? '-') to show a dash for null/undefined values
                html += `<td>${driver[header] ?? '-'}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        seasonTableContainer.innerHTML = html;
    }

    // --- Run the initialization function ---
    init();
});
