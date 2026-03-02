import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../../hooks/useFavorites";
import { supabase } from "../../lib/supabase";
import { Property } from "../../types/property";

/**
 * Favorites screen — shows the user's saved properties with live data.
 */
export default function FavoritesScreen(): React.ReactElement {
    const { favoriteIds, loading: favsLoading, toggleFavorite } = useFavorites();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFavoriteProperties = useCallback(async () => {
        const ids = Array.from(favoriteIds);
        if (ids.length === 0) {
            setProperties([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("properties")
                .select("id, name, location, risk_score")
                .in("id", ids);

            if (!error && data) {
                setProperties(data as Property[]);
            }
        } catch {
            // Non-critical
        } finally {
            setLoading(false);
        }
    }, [favoriteIds]);

    useEffect(() => {
        fetchFavoriteProperties();
    }, [fetchFavoriteProperties]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchFavoriteProperties();
        setRefreshing(false);
    }, [fetchFavoriteProperties]);

    const getRiskColor = (score: number): string => {
        if (score >= 7) return "#EF4444";
        if (score >= 4) return "#F59E0B";
        return "#22C55E";
    };

    const getRiskLabel = (score: number): string => {
        if (score >= 7) return "High Risk";
        if (score >= 4) return "Moderate";
        return "Low Risk";
    };

    const renderItem = useCallback(
        ({ item }: { item: Property }) => (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.cardName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <View style={styles.riskRow}>
                            <View
                                style={[
                                    styles.riskDot,
                                    { backgroundColor: getRiskColor(item.risk_score) },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.riskText,
                                    { color: getRiskColor(item.risk_score) },
                                ]}
                            >
                                {getRiskLabel(item.risk_score)} · {item.risk_score.toFixed(1)}
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={() => toggleFavorite(Number(item.id))}
                        style={styles.removeButton}
                    >
                        <Ionicons name="heart-dislike" size={20} color="#EF4444" />
                    </Pressable>
                </View>
            </View>
        ),
        [toggleFavorite]
    );

    if (favsLoading || loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Saved Places</Text>
                    <Text style={styles.subtitle}>
                        Properties you've bookmarked
                    </Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#89B4FA" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Saved Places</Text>
                <Text style={styles.subtitle}>
                    {properties.length > 0
                        ? `${properties.length} saved propert${properties.length === 1 ? "y" : "ies"}`
                        : "Properties you've bookmarked"}
                </Text>
            </View>

            {properties.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={64} color="#45475A" />
                    <Text style={styles.emptyTitle}>No Saved Places Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Tap the heart icon on a property to save it here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={properties}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#89B4FA"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1E1E2E",
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#CDD6F4",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#6C7086",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        gap: 10,
    },
    card: {
        backgroundColor: "#313244",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#45475A",
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardLeft: {
        flex: 1,
        marginRight: 12,
    },
    cardName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#CDD6F4",
        marginBottom: 6,
    },
    riskRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    riskDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    riskText: {
        fontSize: 13,
        fontWeight: "600",
    },
    removeButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#CDD6F4",
        marginTop: 16,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#6C7086",
        textAlign: "center",
        paddingHorizontal: 40,
    },
});
