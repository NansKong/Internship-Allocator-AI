import json
import sys
from pathlib import Path

from ortools.sat.python import cp_model


def allocate(capacities, eligible_matches, minimums):
    model = cp_model.CpModel()
    choices = {}
    for match in eligible_matches:
        key = (match["candidate"], match["opportunity"])
        if key in choices or key[1] not in capacities:
            raise ValueError(f"Duplicate or unknown match: {key}")
        choices[key] = (model.new_bool_var(str(key)), match)

    for candidate in {key[0] for key in choices}:
        model.add(sum(var for (person, _), (var, _) in choices.items()
                      if person == candidate) <= 1)
    for opportunity, capacity in capacities.items():
        model.add(sum(var for (_, seat), (var, _) in choices.items()
                      if seat == opportunity) <= capacity)
    for group, minimum in minimums.items():
        model.add(sum(var for var, match in choices.values()
                      if group in match["groups"]) >= minimum)

    count = sum(var for var, _ in choices.values())
    model.maximize(count)
    solver = cp_model.CpSolver()
    status = solver.solve(model)
    if status != cp_model.OPTIMAL:
        return {"status": solver.status_name(status), "assignments": []}

    model.add(count == solver.value(count))
    model.maximize(sum(var * match["score"] for var, match in choices.values()))
    status = solver.solve(model)
    assignments = []
    if status == cp_model.OPTIMAL:
        assignments = [
            {"candidate": candidate, "opportunity": opportunity}
            for (candidate, opportunity), (var, _) in choices.items()
            if solver.value(var)
        ]
    return {"status": solver.status_name(status), "assignments": assignments}


if __name__ == "__main__":
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    print(json.dumps(allocate(**payload), indent=2))
