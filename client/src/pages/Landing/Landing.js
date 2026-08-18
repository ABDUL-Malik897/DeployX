import { Navigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import Features from "../../components/Features/Features";
import HowItWorks from "../../components/HowItWorks/HowItWorks";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import LoadingState from '../../components/LoadingState/LoadingState'
import useAuthContext from "../../hooks/useAuthContext";

const Landing = () => {

    const { user, isLoading } = useAuthContext();

    if (isLoading) {
        return <LoadingState/>
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div>
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <CTA />
            <Footer />
        </div>
    );
};

export default Landing;