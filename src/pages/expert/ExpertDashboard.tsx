import { Link } from "react-router-dom";
import { ExpertLayout } from "@/components/layout/ExpertLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreadList } from "@/components/forum";
import { useForumThreads } from "@/hooks/useForum";
import { useAuth } from "@/contexts/auth-context";
import { MessageSquare, CheckCircle, ThumbsUp, HelpCircle, ArrowRight, Award } from "lucide-react";

export default function ExpertDashboard() {
    const { profile } = useAuth();

    // Get unanswered threads
    const { data: unansweredThreads, isLoading: threadsLoading } = useForumThreads({
        sort_by: "unanswered",
        limit: 5,
    });

    return (
        <ExpertLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-6 h-6" />
                                <Badge className="bg-white/20 text-white hover:bg-white/30">Expert</Badge>
                            </div>
                            <h1 className="text-2xl font-bold mb-1">Selamat Datang, {profile?.full_name || "Expert"}!</h1>
                            <p className="text-purple-100">Bantu petani dengan menjawab pertanyaan mereka di forum</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">-</p>
                                    <p className="text-xs text-muted-foreground">Total Jawaban</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">-</p>
                                    <p className="text-xs text-muted-foreground">Jawaban Diterima</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <ThumbsUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">-</p>
                                    <p className="text-xs text-muted-foreground">Total Upvotes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{unansweredThreads?.length || "-"}</p>
                                    <p className="text-xs text-muted-foreground">Butuh Jawaban</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Unanswered Questions */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <HelpCircle className="w-5 h-5 text-amber-500" />
                                Pertanyaan Menunggu Jawaban
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/forum">
                                    Lihat Semua
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ThreadList threads={unansweredThreads || []} isLoading={threadsLoading} emptyMessage="Semua pertanyaan sudah terjawab! 🎉" />
                    </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-muted/30">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-3">💡 Tips Menjadi Expert yang Baik</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Berikan jawaban yang jelas dan mudah dipahami</li>
                            <li>• Sertakan contoh praktis jika memungkinkan</li>
                            <li>• Rujuk sumber yang terpercaya</li>
                            <li>• Respons dengan ramah dan sabar</li>
                            <li>• Tanyakan klarifikasi jika pertanyaan kurang jelas</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </ExpertLayout>
    );
}
