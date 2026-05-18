import { useState, useEffect } from "react";
import { Container, Alert, Spinner } from "react-bootstrap";
import { getHandbook } from "../services/handbook.js";
import { getCurrentUser } from "../services/auth.js";
import HandbookTabs from "../components/handbook/HandbookTabs.jsx";
import HandbookContent from "../components/handbook/HandbookContent.jsx";
import HandbookEditor from "../components/handbook/HandbookEditor.jsx";

function HandbookPage() {
    const [handbook, setHandbook] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const user = getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    useEffect(() => {
        if (!user) {
            setError("Could not load handbook.");
            setLoading(false);
            return;
        }

        async function fetchHandbook() {
            try {
                const data = await getHandbook();
                setHandbook(data);
                if (data.handbookTabs?.length > 0) {
                    setActiveTab(data.handbookTabs[0]);
                }
            } catch {
                setError("Could not load handbook.");
            } finally {
                setLoading(false);
            }
        }

        fetchHandbook();
    }, [user?.id]);

    const handleSaved = (updatedTab) => {
        if (!updatedTab) return;
        setHandbook(prev => ({
            ...prev,
            handbookTabs: prev.handbookTabs.map(t =>
                t.id === updatedTab.id ? updatedTab : t
            )
        }));
        setActiveTab(updatedTab);
    };

    const handleTabCreated = (newTab) => {
        setHandbook(prev => ({
            ...prev,
            handbookTabs: [...prev.handbookTabs, newTab]
        }));
        setActiveTab(newTab);
    };

    const handleTabDeleted = (deletedTabId) => {
        setHandbook(prev => {
            const remaining = prev.handbookTabs.filter(t => t.id !== deletedTabId);
            setActiveTab(remaining.length > 0 ? remaining[0] : null);
            return { ...prev, handbookTabs: remaining };
        });
    };

    if (loading) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" />
        </Container>
    );

    if (error) return (
        <Container className="mt-4">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    return (
        <Container className="mt-4">
            <h4 className="mb-3">{handbook.title}</h4>
            <HandbookTabs
                tabs={handbook.handbookTabs}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                userRole={user.role}
                handbookId={handbook.id}
                onTabCreated={handleTabCreated}
                onTabDeleted={handleTabDeleted}
            />
            {isAdmin
                ? <HandbookEditor
                    tab={activeTab}
                    onSaved={handleSaved}
                    onTabDeleted={handleTabDeleted}
                  />
                : <HandbookContent tab={activeTab} />
            }
        </Container>
    );
}

export default HandbookPage;