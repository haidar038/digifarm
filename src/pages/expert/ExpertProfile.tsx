import { ExpertLayout } from "@/components/layout/ExpertLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { Award, Mail, Phone, MapPin, Calendar, Settings, MessageSquare, CheckCircle, ThumbsUp } from "lucide-react";

export default function ExpertProfile() {
    const { profile, user } = useAuth();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getLocationString = () => {
        const parts = [];
        if (profile?.village_name) parts.push(profile.village_name);
        if (profile?.district_name) parts.push(profile.district_name);
        if (profile?.regency_name) parts.push(profile.regency_name);
        if (profile?.province_name) parts.push(profile.province_name);
        return parts.length > 0 ? parts.join(", ") : "Belum diatur";
    };

    return (
        <ExpertLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile Header */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback className="text-2xl bg-purple-100 text-purple-800">{profile?.full_name ? getInitials(profile.full_name) : "EX"}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <h1 className="text-2xl font-bold">{profile?.full_name || "Expert"}</h1>
                                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                        <Award className="w-3 h-3 mr-1" />
                                        Expert
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mb-4">Ahli Pertanian</p>

                                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                                    {user?.email && (
                                        <div className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {user.email}
                                        </div>
                                    )}
                                    {profile?.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {profile.phone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button variant="outline">
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Profil
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold">-</p>
                            <p className="text-sm text-muted-foreground">Total Jawaban</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 text-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold">-</p>
                            <p className="text-sm text-muted-foreground">Jawaban Diterima</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 text-center">
                            <ThumbsUp className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold">-</p>
                            <p className="text-sm text-muted-foreground">Total Upvotes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Profil</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Lokasi</p>
                                <p className="font-medium">{getLocationString()}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Bergabung Sejak</p>
                                <p className="font-medium">
                                    {profile?.created_at
                                        ? new Date(profile.created_at).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                          })
                                        : "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ExpertLayout>
    );
}
