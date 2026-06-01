import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import greenImage from '../assets/Green.png';
import flowerImage from '../assets/flower.png';
import leftArrow from '../assets/left.png';
import rightArrow from '../assets/right.png';
import './Prefoot.css';
import { getEulogies } from '../data/eulogies';

function Prefoot() {
  const [memorials, setMemorials] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [cardsPerSlide, setCardsPerSlide] = useState(3);

  useEffect(() => {
    let mounted = true;
    getEulogies()
      .then((items) => {
        if (mounted) {
          setMemorials(items);
        }
      })
      .catch(() => {
        if (mounted) {
          setMemorials([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function updateCardsPerSlide() {
      if (window.matchMedia('(max-width: 760px)').matches) {
        setCardsPerSlide(1);
      } else {
        setCardsPerSlide(3);
      }
    }

    updateCardsPerSlide();
    window.addEventListener('resize', updateCardsPerSlide);

    return () => {
      window.removeEventListener('resize', updateCardsPerSlide);
    };
  }, []);

  const recentEulogies = useMemo(() => (
    memorials
      .flatMap((memorial) => memorial.eulogies.map((eulogy) => ({
        ...eulogy,
        memorialName: memorial.full_name,
        memorialSlug: memorial.slug,
        lifespan: memorial.lifespan,
        summary: memorial.summary,
        imageUrl: memorial.image_url,
      })))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  ), [memorials]);

  const activeIndex = recentEulogies.length > 0 ? slideIndex % recentEulogies.length : 0;
  const visibleEulogies = useMemo(() => {
    if (recentEulogies.length === 0) return [];

    const activeEulogy = recentEulogies[activeIndex];
    if (cardsPerSlide === 1 || recentEulogies.length === 1) {
      return [{ eulogy: activeEulogy, position: 'active' }];
    }

    if (recentEulogies.length === 2) {
      return [
        { eulogy: activeEulogy, position: 'active' },
        { eulogy: recentEulogies[(activeIndex + 1) % recentEulogies.length], position: 'next' },
      ];
    }

    return [
      { eulogy: recentEulogies[(activeIndex - 1 + recentEulogies.length) % recentEulogies.length], position: 'prev' },
      { eulogy: activeEulogy, position: 'active' },
      { eulogy: recentEulogies[(activeIndex + 1) % recentEulogies.length], position: 'next' },
    ];
  }, [activeIndex, cardsPerSlide, recentEulogies]);

  function moveSlider(direction) {
    setSlideIndex((current) => {
      if (recentEulogies.length === 0) return 0;
      return (current + direction + recentEulogies.length) % recentEulogies.length;
    });
  }

  return (
    <div className="precont">
      <Link id="rebut" to="/Eulogies">Recent Eulogies</Link>
      <div className="recent-slider" aria-label="Recent eulogies slider">
        <button
          className="slider-arrow slider-arrow-left"
          type="button"
          onClick={() => moveSlider(-1)}
          disabled={recentEulogies.length <= 1}
          aria-label="Show previous eulogies"
        >
          <img src={leftArrow} alt="" aria-hidden="true" />
        </button>

        <div className="rtri">
          {visibleEulogies.map(({ eulogy, position }) => (
            <Link
              className={`mrtri carousel-card is-${position}`}
              to={`/Eulogies/${eulogy.memorialSlug}`}
              key={eulogy.id || `${eulogy.memorialSlug}-${eulogy.author_name}-${eulogy.created_at}`}
            >
              <span>{eulogy.memorialName}</span>
              <small>{eulogy.written_at || eulogy.lifespan}</small>
              <p>{eulogy.story}</p>
              <em>By {eulogy.author_name}</em>
            </Link>
          ))}

          {recentEulogies.length === 0 && (
            <div className="mrtri empty-slide">
              <span>No eulogies yet</span>
              <p>Create the first tribute and it will appear here.</p>
            </div>
          )}
        </div>

        <button
          className="slider-arrow slider-arrow-right"
          type="button"
          onClick={() => moveSlider(1)}
          disabled={recentEulogies.length <= 1}
          aria-label="Show next eulogies"
        >
          <img src={rightArrow} alt="" aria-hidden="true" />
        </button>
      </div>

      {recentEulogies.length > 0 && (
        <div className="slider-dots" aria-hidden="true">
          {recentEulogies.map((eulogy, index) => (
            <span className={index === activeIndex ? 'active-dot' : ''} key={eulogy.id || index} />
          ))}
        </div>
      )}

      <div className="grin">
        <img id="grin" src={greenImage} alt="" />
      </div>
      <div className="flower">
        <img id="maua" src={flowerImage} alt="" />
        <div className="par">
          <div id="par">
            <p id="p1">Every life leaves a story.</p>
            <p id="p2">Let's keep their light shining.</p>
          </div>
          <div id="butr"><Link id="butri" to="/CreateEulogy">Create a Tribute</Link></div>
        </div>
      </div>
    </div>
  );
}

export default Prefoot;
