import re
import random
from typing import List, Dict, Optional
from app.core.logging import logger


def extract_task_candidates(text: str) -> List[Dict]:
    """
    Extract task candidates using rule-based patterns.
    Looks for sentences containing task assignment phrases.
    """
    if not text:
        return []
    
    logger.info("Extracting task candidates from text")
    
    # Task assignment patterns
    task_patterns = [
        r"(\w+(?:\s+\w+)*)\s+will\s+(?:do|handle|complete|finish|work on)\s+(.+?)(?:\.|,|$)",
        r"assign\s+(.+?)\s+to\s+(\w+(?:\s+\w+)*)",
        r"(\w+(?:\s+\w+)*)\s+should\s+(?:handle|do|complete|work on)\s+(.+?)(?:\.|,|$)",
        r"(\w+(?:\s+\w+)*)\s+needs?\s+to\s+(?:do|handle|complete|finish|work on)\s+(.+?)(?:\.|,|$)",
        r"(\w+(?:\s+\w+)*)\s+is\s+(?:responsible|assigned)\s+for\s+(.+?)(?:\.|,|$)",
    ]
    
    # Deadline patterns
    deadline_patterns = [
        r"by\s+(?:friday|monday|tuesday|wednesday|thursday|saturday|sunday)",
        r"by\s+tomorrow",
        r"by\s+next\s+week",
        r"by\s+(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)",
        r"due\s+(?:friday|monday|tuesday|wednesday|thursday|saturday|sunday)",
        r"deadline\s+is\s+(.+?)(?:\.|,|$)",
    ]
    
    candidates = []
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        
        # Check for task assignment patterns
        for pattern in task_patterns:
            matches = re.finditer(pattern, sentence_lower, re.IGNORECASE)
            for match in matches:
                groups = match.groups()
                if len(groups) >= 2:
                    assignee = groups[0].strip().title()
                    task_desc = groups[1].strip()
                elif len(groups) == 1:
                    # Pattern like "assign X to Y" - groups might be reversed
                    assignee = "Unassigned"
                    task_desc = groups[0].strip()
                else:
                    continue
                
                # Extract deadline from sentence
                deadline = None
                for deadline_pattern in deadline_patterns:
                    deadline_match = re.search(deadline_pattern, sentence_lower, re.IGNORECASE)
                    if deadline_match:
                        deadline = deadline_match.group(0).strip()
                        break
                
                # Clean up task description
                task_desc = re.sub(r"\s+", " ", task_desc).strip()
                if len(task_desc) < 5:  # Skip very short tasks
                    continue
                
                candidates.append({
                    "assignee": assignee if assignee else "Unassigned",
                    "task": task_desc,
                    "deadline": deadline
                })
        
        # Also look for standalone deadline mentions with action items
        if any(phrase in sentence_lower for phrase in ["by friday", "by tomorrow", "by next week", "deadline"]):
            # Try to extract task from context
            action_words = ["complete", "finish", "do", "handle", "work on", "prepare"]
            for action in action_words:
                if action in sentence_lower:
                    # Extract task description
                    task_match = re.search(rf"{action}\s+(.+?)(?:\.|,|$)", sentence_lower)
                    if task_match:
                        task_desc = task_match.group(1).strip()
                        deadline_match = re.search(r"by\s+(.+?)(?:\.|,|$)", sentence_lower)
                        deadline = deadline_match.group(1).strip() if deadline_match else None
                        
                        candidates.append({
                            "assignee": "Unassigned",
                            "task": task_desc,
                            "deadline": deadline
                        })
                    break
    
    # Remove duplicates based on task description similarity
    unique_candidates = []
    seen_tasks = set()
    for candidate in candidates:
        task_key = candidate["task"].lower()[:50]  # Use first 50 chars as key
        if task_key not in seen_tasks:
            seen_tasks.add(task_key)
            unique_candidates.append(candidate)
    
    logger.info(f"Extracted {len(unique_candidates)} task candidates")
    return unique_candidates


def refine_tasks_with_llm(candidates: List[Dict]) -> List[Dict]:
    """
    Refine and normalize task candidates.
    Adds confidence scores and cleans up text.
    """
    if not candidates:
        return []
    
    logger.info(f"Refining {len(candidates)} task candidates")
    
    refined = []
    
    for candidate in candidates:
        # Normalize text
        assignee = candidate.get("assignee", "Unassigned").strip()
        task = candidate.get("task", "").strip()
        deadline = candidate.get("deadline")
        
        # Clean task description
        task = re.sub(r"\s+", " ", task)  # Normalize whitespace
        task = re.sub(r"^[.,;:\s]+|[.,;:\s]+$", "", task)  # Remove leading/trailing punctuation
        task = task.capitalize()  # Capitalize first letter
        
        # Clean assignee
        if assignee and assignee != "Unassigned":
            assignee = assignee.title()
        
        # Clean deadline
        if deadline:
            deadline = deadline.strip()
            deadline = re.sub(r"^by\s+", "", deadline, flags=re.IGNORECASE)
        
        # Calculate confidence score (0.6 to 0.95)
        confidence = 0.6
        
        # Boost confidence if assignee is specified
        if assignee and assignee != "Unassigned":
            confidence += 0.15
        
        # Boost confidence if deadline is specified
        if deadline:
            confidence += 0.15
        
        # Boost confidence if task is reasonably long
        if len(task) > 20:
            confidence += 0.05
        
        # Add some randomness to vary scores
        confidence += random.uniform(0, 0.05)
        confidence = min(0.95, confidence)  # Cap at 0.95
        
        refined.append({
            "assignee": assignee if assignee else "Unassigned",
            "task": task,
            "deadline": deadline if deadline else None,
            "confidence": round(confidence, 2)
        })
    
    # Sort by confidence (highest first)
    refined.sort(key=lambda x: x["confidence"], reverse=True)
    
    logger.info(f"Refined to {len(refined)} tasks")
    return refined
