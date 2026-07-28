import Header from "../../components/Header/Header";
import Hero from "../../components/Hero/Hero";
import HowItWorks from "../../components/HowItWorks/HowItWorks";
import WhyChoose from "../../components/WhyChoose/WhyChoose";
import Categories from "../../components/Categories/Categories";

function Home() {
  return (
    <>
      <Header />
      <Hero />
      <HowItWorks />
      <WhyChoose />
      <Categories />
    </>
  );
}

export default Home;