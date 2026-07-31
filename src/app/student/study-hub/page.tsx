"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VocabCards from "@/components/study-hub/vocab-cards";
import SelfQuiz from "@/components/study-hub/self-quiz";
import Pomodoro from "@/components/study-hub/pomodoro";

export default function StudyHub() {
  const [activeTab, setActiveTab] = useState("flashcard");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Çalışma Merkezi
        </h1>
        <p className="text-slate-500 mt-1">
          Kelimelerinizi ezberleyin, pratik testlerle kendinizi test edin ve Pomodoro ile odaklanın.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="flashcard"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-100 rounded-xl p-1">
          <TabsTrigger
            value="flashcard"
            className="rounded-lg text-xs sm:text-sm font-semibold py-2.5 transition-all text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            🗂️ Flashcard
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="rounded-lg text-xs sm:text-sm font-semibold py-2.5 transition-all text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            ✍️ Pratik Sınav
          </TabsTrigger>
          <TabsTrigger
            value="pomodoro"
            className="rounded-lg text-xs sm:text-sm font-semibold py-2.5 transition-all text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            ⏱️ Pomodoro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcard" className="outline-none focus:ring-0">
          <VocabCards />
        </TabsContent>

        <TabsContent value="quiz" className="outline-none focus:ring-0">
          <SelfQuiz />
        </TabsContent>

        <TabsContent value="pomodoro" className="outline-none focus:ring-0">
          <Pomodoro />
        </TabsContent>
      </Tabs>
    </div>
  );
}
