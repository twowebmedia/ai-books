// public/script.js

document.getElementById('storybookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = {
    title: form.title.value,
    location: form.location.value,
    plot: form.plot.value,
    mainCharacter: {
      name: form.mainName.value,
      age: form.mainAge.value,
      hair: form.mainHair.value,
      eyes: form.mainEyes.value,
      personality: form.mainPersonality.value
    },
    readingLevel: form.readingLevel.value
  };

  try {
    // STEP 1: Fetch synopsis
    const synopsisRes = await fetch('/api/generate-synopsis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const { synopsis } = await synopsisRes.json();
    document.getElementById('synopsis').innerText = synopsis;

    // STEP 2: Fetch cover image
    const imageRes = await fetch('/api/generate-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, synopsis })
    });
    const { imageUrl } = await imageRes.json();

    const imageElement = document.getElementById('coverImage');
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
  } catch (err) {
    alert('Something went wrong while generating your book. Please try again.');
    console.error(err);
  }
});
