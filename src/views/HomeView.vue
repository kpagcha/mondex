<template>
  <div class="panel">
    <h1>mondex</h1>
    <p class="muted">A competitive Pokémon dex. The Pokémon, moves and formats dex is on the way; the type tools are ready now.</p>
  </div>
  <div class="tools">
    <RouterLink to="/types" class="panel tool">
      <h2>Type chart</h2>
      <p class="muted">Every attacking type against every defending type.</p>
    </RouterLink>
    <RouterLink to="/types/calc" class="panel tool">
      <h2>Type calculator</h2>
      <p class="muted">Weaknesses and resistances for any type combination, and the coverage of a moveset.</p>
    </RouterLink>
    <RouterLink to="/types/quiz" class="panel tool">
      <h2>Type quiz</h2>
      <p class="muted">Learn the chart with spaced repetition. Matchups you miss come back until you know them.</p>
    </RouterLink>
  </div>
</template>

<style scoped>
.tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.tool {
  display: block;
  color: var(--text);
  margin: 0;
}
.tool:hover {
  text-decoration: none;
  border-color: var(--accent);
}
.tool h2 {
  color: var(--link);
}
.tool p {
  margin: 0;
}
</style>
