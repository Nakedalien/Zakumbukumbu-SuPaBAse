import { useEffect } from 'react';
import HeroSection from "../HeroSection";
import Footer from '../Footer';
import MidSec from '../MidSec';
import Prefoot from '../Prefoot';
import DirectorySection from '../DirectorySection';

function Home (){
    useEffect(() => {
        const elements = document.querySelectorAll('.home-animate');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-visible', entry.isIntersecting);
            });
        }, {
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.12,
        });

        elements.forEach((element) => observer.observe(element));

        return () => {
            observer.disconnect();
        };
    }, []);

    return(
        <>
        <main className="home-page">
        <HeroSection/>
        <MidSec/>
        <div className="home-animate"><Prefoot/></div>
        <div className="home-animate"><DirectorySection/></div>
        </main>
        <Footer/>
        </>
    )
}

export default Home;


