import React, { useState, useEffect } from "react";
import { SkiDestination } from "@/entities/SkiDestination";
import { Review } from "@/entities/Review";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, Loader2, Mountain } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const StarRating = ({ rating }) => (
  <div className="flex gap-1" dir="ltr">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const RecommendedDestinationCard = ({ destination, review, onLogin }) => {
    // Safety checks for destination
    if (!destination || typeof destination !== 'object' || !destination.id || !destination.name) {
        return null;
    }

    const displayName = review?.user_nickname || review?.user_full_name || "משתמש אנונימי";
    const avatarInitial = displayName.charAt(0);
    
    return (
        <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                 <Link to={createPageUrl(`SkiDestinationDetail?id=${destination.id}`)}>
                    <div className="relative h-48 bg-cover bg-center" style={{backgroundImage: `url(${destination.image_url || ''})`}}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                        <div className="absolute bottom-4 right-4 text-white">
                            <h3 className="text-2xl font-bold">{destination.name}</h3>
                            <p>{destination.country || ''}</p>
                        </div>
                    </div>
                </Link>
                <CardContent className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={review?.user_profile_image_url} />
                            <AvatarFallback>{avatarInitial}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-slate-800">{displayName}</p>
                            {review?.user_ski_level && (
                                <Badge variant="outline" className="text-xs">{review.user_ski_level}</Badge>
                            )}
                        </div>
                    </div>

                    <blockquote className="border-r-4 border-blue-500 pr-4 italic text-slate-600 mb-4 flex-grow">
                      "{review?.comment || 'אין תגובה מפורטת, אך הדירוג מדבר בעד עצמו!'}"
                    </blockquote>
                    
                    <div className="mt-auto pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-sm">דירוג כללי:</p>
                            <StarRating rating={review?.general_rating || 0} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default function RecommendedDestinations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviews, destinations, currentUser] = await Promise.all([
          Review.filter({ status: "approved" }),
          SkiDestination.list(),
          User.me().catch(() => null)
        ]);

        // Filter out null/invalid destinations first
        const validDestinations = (destinations || []).filter(dest => 
          dest && 
          typeof dest === 'object' && 
          dest.id && 
          typeof dest.name === 'string' && 
          dest.name.length > 0
        );

        const destinationMap = validDestinations.reduce((acc, dest) => {
          acc[dest.id] = dest;
          return acc;
        }, {});
        
        // Filter out null/invalid reviews and ensure destination exists
        const validReviews = (reviews || []).filter(review => 
          review && 
          typeof review === 'object' && 
          review.id &&
          review.destination_id &&
          review.general_rating >= 4 &&
          destinationMap[review.destination_id]
        );

        const validRecommendations = validReviews
            .map(review => ({
                review,
                destination: destinationMap[review.destination_id]
            }))
            .filter(item => item.destination && item.review) // Double check both exist
            .sort((a, b) => 
              (b.review?.general_rating || 0) - (a.review?.general_rating || 0) || 
              new Date(b.review?.created_date || 0) - new Date(a.review?.created_date || 0)
            );

        setRecommendations(validRecommendations);
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogin = async () => {
      try {
          await User.login();
          const currentUser = await User.me();
          setUser(currentUser);
      } catch (error) {
          console.error("Login failed:", error);
      }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8" 
        dir="rtl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 mb-4 font-semibold">
                <Star className="w-5 h-5 text-blue-600" />
                הכי שווה שיש
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">היעדים המומלצים שלנו</h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                היעדים שקיבלו את הדירוגים הגבוהים ביותר מהגולשים שלנו. תכנון נעים!
            </p>
        </motion.div>

        {recommendations.length > 0 ? (
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
            >
                {recommendations.map(({ review, destination }) => (
                    <RecommendedDestinationCard 
                        key={review?.id || Math.random()} 
                        destination={destination} 
                        review={review}
                        onLogin={handleLogin}
                    />
                ))}
            </motion.div>
        ) : (
             <motion.div variants={itemVariants} className="text-center py-16 bg-white rounded-xl shadow-md">
                <Mountain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-slate-700">עדיין אין המלצות</h3>
                <p className="text-slate-500 mt-2">נראה שעדיין לא הצטברו מספיק המלצות. בקרו שוב בקרוב!</p>
            </motion.div>
        )}
      </div>
    </motion.div>
  );
}