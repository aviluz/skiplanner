import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar } from "lucide-react";
import { articleUrl } from "@/lib/articleUtils";

/**
 * Reusable article card.
 * showDate / showAuthor / showExcerpt control which meta is rendered.
 */
export default function ArticleCard({ article, showDate = true, showAuthor = true, showExcerpt = true }) {
  if (!article) return null;
  return (
    <Link to={articleUrl(article)}>
      <Card className="group bg-white border-0 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        {article.featured_image_url ? (
          <div className="h-44 overflow-hidden">
            <img
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-400" />
          </div>
        )}
        <CardContent className="p-5 flex flex-col flex-grow">
          {article.category && (
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 mb-2 w-fit text-xs">
              {article.category}
            </Badge>
          )}
          <h3 className="font-bold text-slate-800 text-base leading-snug mb-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>
          {showExcerpt && article.excerpt && (
            <p className="text-sm text-slate-500 line-clamp-2 flex-grow">{article.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
            {showDate && article.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.published_at).toLocaleDateString("he-IL")}
              </span>
            )}
            {showAuthor && article.author_name && <span>• {article.author_name}</span>}
          </div>
          <span className="text-blue-600 text-sm mt-3 inline-block font-medium">לקריאת המאמר ←</span>
        </CardContent>
      </Card>
    </Link>
  );
}