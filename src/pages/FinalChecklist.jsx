const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Mail, ArrowLeft, LogIn } from 'lucide-react';

export default function FeedbackPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();