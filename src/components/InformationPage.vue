<template>
  <div class="info-page">
    <h1>🌿 About EcoHabit</h1>

    <section>
      <h2>About the App</h2>
      <p>
        The EcoHabit application was designed to bridge the gap between users' daily habits and their environmental impact. The goal is to help users understand and reduce their transportation emissions through awareness, motivation and friendly competition. The app tracks live trips, logs travel history, compares modes of transport, offers alternative green routes, and ranks users on a global leaderboard to encourage greener choices. Unlike existing solutions who only target a niche audience with high barriers for entry such as paywalls, EcoHabit is designed for casual users - automated, simple, social and educational, promoting users to make sustainable transport decisions and collectively reducing global carbon emissions.
      </p>
    </section>

    <section>
      <h2>How It Works</h2>
      <ol>
        <li>Select your transport mode (Car, Bus, Metro, Tram, or Flight)</li>
        <li>Enter trip details manually or use live tracking</li>
        <li>Calculate and view emissions instantly</li>
        <li>Save trips to your history and compare performance</li>
      </ol>
    </section>

    <section>
      <h2>Understanding Emissions</h2>
      <p>
        Carbon emissions (CO₂e) represent greenhouse gases released from your travel.
        Cars produce the most per km, while trams and metros are the most efficient.
      </p>
      <ul>
        <li>Car: 120–250 g/km</li>
        <li>Bus: 70–90 g/km per passenger</li>
        <li>Metro/Tram: 30–50 g/km</li>
        <li>Flight: 200–300 g/km</li>
      </ul>
    </section>

    <section>
      <h2>Our Goals</h2>
      <ul>
        <li>Promote sustainable transport habits</li>
        <li>Encourage carbon-conscious decision-making</li>
        <li>Ensure transparency in emission tracking</li>
        <li>Maintain ethical and privacy-focused design</li>
      </ul>
    </section>

    <section>
      <h2>Privacy & Data Ethics</h2>
      <p>
        EcoHabit uses location data only during active trips. All personal data is securely stored and managed
        under the Australian Privacy Principles (APPs).
      </p>
    </section>

    <section>
      <h2>Future Enhancements</h2>
      <ul>
        <li>Voice command support for hands-free use</li>
        <li>Greener route recommendations using AI</li>
        <li>Expanded emission tracking for lifestyle activities</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
  .info-page {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h1, h2 {
    color: #2e7d32;
  }

  p, li {
    color: #333;
    line-height: 1.6;
  }

  ul, ol {
    margin-left: 1.5rem;
  }

  section {
    margin-bottom: 1.5rem;
  }
</style>
