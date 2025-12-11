
      // Counter animation
      const counters = document.querySelectorAll(".stat-number");

      counters.forEach((counter) => {
        const target = +counter.getAttribute("data-target");
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };

        updateCounter();
      });
