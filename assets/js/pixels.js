document.addEventListener('DOMContentLoaded', function() {
  const yearGrid = document.getElementById('yearGrid');
  const analyticsDiv = document.querySelector('.analytics');
  const currentYear = new Date().getFullYear();
  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const moodScores = {
    'goated': 5,
    'great': 4,
    'average': 3,
    'mid/stressful': 2,
    'awful': 1
  };

  function createMonth(monthIndex) {
    const monthDiv = document.createElement('div');
    monthDiv.className = 'month';
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'month-title';
    monthTitle.textContent = months[monthIndex];
    monthDiv.appendChild(monthTitle);
    
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';
    
    // Add day labels
    weekDays.forEach(day => {
      const dayLabel = document.createElement('div');
      dayLabel.className = 'day-label';
      dayLabel.textContent = day;
      daysGrid.appendChild(dayLabel);
    });
    
    // Calculate first day of month and total days
    const firstDay = new Date(currentYear, monthIndex, 1).getDay();
    const totalDays = new Date(currentYear, monthIndex + 1, 0).getDate();
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'day empty';
      daysGrid.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'day';
      // Ensure 2-digit month and day for consistent formatting
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const date = `${currentYear}-${formattedMonth}-${formattedDay}`;
      dayDiv.dataset.date = date;
      daysGrid.appendChild(dayDiv);
    }
    
    monthDiv.appendChild(daysGrid);
    return monthDiv;
  }

  function calculateMonthlyAnalytics(data) {
    const monthlyScores = {};
    
    // Initialize monthly scores
    months.forEach((month, index) => {
      monthlyScores[index] = {
        total: 0,
        count: 0,
        month: month
      };
    });

    // Calculate totals for each month
    Object.entries(data).forEach(([date, moodData]) => {
      const month = parseInt(date.split('-')[1]) - 1;
      const score = moodScores[moodData.mood];
      if (score) {
        monthlyScores[month].total += score;
        monthlyScores[month].count++;
      }
    });

    // Calculate averages and find best/worst months
    let bestMonth = null;
    let worstMonth = null;
    let bestAvg = -1;
    let worstAvg = 6;

    Object.entries(monthlyScores).forEach(([month, data]) => {
      if (data.count > 0) {
        const avg = data.total / data.count;
        data.average = avg;
        
        if (avg > bestAvg) {
          bestAvg = avg;
          bestMonth = data;
        }
        if (avg < worstAvg) {
          worstAvg = avg;
          worstMonth = data;
        }
      }
    });

    return { bestMonth, worstMonth };
  }

  async function fetchMoodColors() {
    try {
      const response = await fetch('https://mood-pi-three.vercel.app/api/refreshMood');
      const data = await response.json();
      
      // Calculate and display analytics
      const { bestMonth, worstMonth } = calculateMonthlyAnalytics(data);
      if (bestMonth && worstMonth) {
        analyticsDiv.textContent = `Best month so far: ${bestMonth.month} (${bestMonth.average.toFixed(2)}/5 average) | Worst month so far: ${worstMonth.month} (${worstMonth.average.toFixed(2)}/5 average)`;
      }
      
      // Apply colors to days
      Object.entries(data).forEach(([date, moodData]) => {
        const { color, mood } = moodData;
        const [year, month, day] = date.split('-');
        const normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const dayElement = document.querySelector(`[data-date="${normalizedDate}"]`);
        if (dayElement) {
          dayElement.style.backgroundColor = color;
          dayElement.dataset.mood = mood;
          
          dayElement.addEventListener('mouseenter', () => {
            const tooltip = document.createElement('div');
            tooltip.className = 'mood-tooltip';
            tooltip.textContent = mood;
            dayElement.appendChild(tooltip);
          });
          
          dayElement.addEventListener('mouseleave', () => {
            const tooltip = dayElement.querySelector('.mood-tooltip');
            if (tooltip) {
              tooltip.remove();
            }
          });
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Create all months
  months.forEach((_, index) => {
    yearGrid.appendChild(createMonth(index));
  });

  // Initial fetch
  fetchMoodColors();
  
  // Refresh every 5 minutes
  setInterval(fetchMoodColors, 5 * 60 * 1000);
});

console.log("Script fully loaded");
