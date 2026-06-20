import React, { useState, useEffect } from "react";
import { RecommendedLink } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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

export default function RecommendedLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const data = await RecommendedLink.list("-created_date");
      setLinks(data);
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (linkId) => {
    setExpandedCards(prev => ({
      ...prev,
      [linkId]: !prev[linkId]
    }));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" 
      dir="rtl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            קישורים מומלצים
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            משאבים ומידע שימושי לתכנון חופשת סקי מושלמת
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {links.map((link) => {
            const isExpanded = expandedCards[link.id];
            return (
              <motion.div key={link.id} variants={itemVariants}>
                <Card className="group flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                  {link.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={link.image_url}
                        alt={link.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-slate-800">{link.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="flex-grow flex flex-col">
                    <div className="flex-grow">
                      {link.description && (
                        <div className="text-slate-600 text-sm leading-relaxed mb-4">
                          <div className={!isExpanded ? "line-clamp-3" : ""}>
                            {link.description}
                          </div>
                          {link.description.length > 150 && (
                            <button
                              onClick={() => toggleExpand(link.id)}
                              className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 mt-2 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <span>סגירה</span>
                                  <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  <span>קרא עוד</span>
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 mt-auto"
                    >
                      <a href={link.link_url} target="_blank" rel="noopener noreferrer">
                        עבור לקישור
                        <ExternalLink className="w-4 h-4 mr-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {links.length === 0 && !loading && (
          <div className="text-center py-16">
            <ExternalLink className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">אין קישורים זמינים כרגע</h3>
            <p className="text-slate-500">בקרו בשנית בקרוב למשאבים מומלצים</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}