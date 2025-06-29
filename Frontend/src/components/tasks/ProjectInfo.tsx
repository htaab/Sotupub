import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/project";
import { AlertCircle, Calendar, FileText, User, Users } from "lucide-react";

interface ProjectInfoProps {
    projectData: Project | null | undefined;
    isLoadingProject: boolean;
    projectError: Error | null;
}

const ProjectInfo = ({ projectData, isLoadingProject, projectError }: ProjectInfoProps) => {
    return (
        <>
            {isLoadingProject ? (
                <div className="space-y-3">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-32 w-full" />
                </div>
            ) : projectError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        There was a problem loading the project information. Please try again later.
                    </AlertDescription>
                </Alert>
            ) : projectData ? (
                <Card className="p-0">
                    <Accordion type="single" collapsible>
                        <AccordionItem value="project-information">
                            <CardHeader>
                                <AccordionTrigger className="cursor-pointer items-center">
                                    <div className="flex items-center justify-between flex-wrap w-full">
                                        <div>
                                            <CardTitle className="text-xl font-bold tracking-tight">
                                                Project : {projectData.name}
                                            </CardTitle>
                                            <CardDescription>Entreprise : {projectData.entreprise}</CardDescription>
                                        </div>
                                        <Badge>Status : {projectData?.status}</Badge>
                                    </div>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent>
                                <CardContent>
                                    <Tabs defaultValue="details" >
                                        <TabsList className="w-full">
                                            <TabsTrigger value="details">Details</TabsTrigger>
                                            <TabsTrigger value="team">Team</TabsTrigger>
                                            {projectData.products && projectData.products.length > 0 && <TabsTrigger value="products">Products</TabsTrigger>}
                                        </TabsList>

                                        <TabsContent value="details" className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {projectData.description && (
                                                    <Card className="py-4">
                                                        <CardHeader className="px-4">
                                                            <CardTitle className="text-sm font-medium flex items-center">
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Description
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="px-4 whitespace-pre-line">
                                                            {projectData.description}
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Timeline Card */}
                                                <Card className="py-4">
                                                    <CardHeader className="px-4">
                                                        <CardTitle className="text-sm font-medium flex items-center">
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            Timeline
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="px-4">
                                                        <div className="flex justify-between text-sm flex-wrap">
                                                            <div>
                                                                <p className="text-muted-foreground">Start Date</p>
                                                                <p className="font-medium">
                                                                    {new Date(projectData.beginDate).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">End Date</p>
                                                                <p className="font-medium">
                                                                    {new Date(projectData.endDate).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="team">
                                            {/* Team Card */}
                                            <Card className="py-4">
                                                <CardHeader className="px-4">
                                                    <CardTitle className="text-sm font-medium flex items-center">
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Team
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="bg-muted/30 p-3 rounded-lg flex flex-col">
                                                            <p className="text-muted-foreground text-xs mb-1">Client</p>
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                                                                    <User className="h-4 w-4" />
                                                                </div>
                                                                <p className="font-medium">
                                                                    {typeof projectData.client === 'string'
                                                                        ? projectData.client
                                                                        : projectData.client?.name}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-muted/30 p-3 rounded-lg flex flex-col">
                                                            <p className="text-muted-foreground text-xs mb-1">Project Manager</p>
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                                                                    <User className="h-4 w-4" />
                                                                </div>
                                                                <p className="font-medium">
                                                                    {typeof projectData.projectManager === 'string'
                                                                        ? projectData.projectManager
                                                                        : projectData.projectManager?.name}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {projectData.stockManager && (
                                                            <div className="bg-muted/30 p-3 rounded-lg flex flex-col">
                                                                <p className="text-muted-foreground text-xs mb-1">Stock Manager</p>
                                                                <div className="flex items-center">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                                                                        <User className="h-4 w-4" />
                                                                    </div>
                                                                    <p className="font-medium">
                                                                        {typeof projectData.stockManager === 'string'
                                                                            ? projectData.stockManager
                                                                            : projectData.stockManager?.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* Products (if any) */}
                                        {projectData.products && projectData.products.length > 0 && (
                                            <TabsContent value="products">
                                                <Card className="py-4">
                                                    <CardHeader className="px-4">
                                                        <CardTitle>Products ({projectData.products.length})</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="px-4">
                                                        <ul className="text-sm space-y-1">
                                                            {projectData.products.slice(0, 3).map((item: Project["products"][0], index: number) => (
                                                                <li key={index} className="flex justify-between">
                                                                    <span>{typeof item.product === 'string'
                                                                        ? item.product
                                                                        : item.product?.name}</span>
                                                                    <span className="font-medium">Qty: {item.quantity}</span>
                                                                </li>
                                                            ))}
                                                            {projectData.products.length > 3 && (
                                                                <li className="text-muted-foreground text-xs">
                                                                    +{projectData.products.length - 3} more products
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                        )}
                                    </Tabs>
                                </CardContent>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
            ) : (
                <Card className="p-6">
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">No Project Found</h3>
                        <p className="text-muted-foreground">
                            The project you're looking for doesn't exist or hasn't been loaded yet.
                        </p>
                    </div>
                </Card>
            )}
        </>
    );
};

export default ProjectInfo;