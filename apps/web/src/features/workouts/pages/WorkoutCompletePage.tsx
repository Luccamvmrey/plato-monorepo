import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { path } from "@/core/constants/path";

const WorkoutCompletePage = () => {
    const [, navigate] = useLocation();
    const { id } = useParams();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(`${path.WORKOUT_SUMMARY}/${id}`, { replace: true });
        }, 1500);
        return () => clearTimeout(timer);
    }, [id, navigate]);

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
            <motion.div
                initial={{ x: "100vw" }}
                animate={{ x: ["100vw", "0vw", "0vw", "-100vw"] }}
                transition={{
                    times: [0, 0.27, 0.73, 1],
                    duration: 1.5,
                    ease: "easeInOut",
                }}
                className="flex items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 18 }}
                    className="w-24 h-24 rounded-full bg-success flex items-center justify-center"
                >
                    <Check className="w-12 h-12 text-white stroke-[2.5]" strokeWidth={2.5} />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default WorkoutCompletePage;
