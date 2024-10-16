import React from 'react'
import Banner from '../components/Banner'
import Accommodation from '../components/Accommodation'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'


function Home() {
  return (
    <div>
        <Banner/>
        <Accommodation/>
        <Testimonials/>
        <Footer/>
    </div>
  )
}

export default Home