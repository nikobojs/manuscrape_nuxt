import { requireNumber } from "./helpers";
import { type RouteParams } from "vue-router";

export const useProjects = async (params?: RouteParams | undefined) => {
  const { hasRoles, refreshUser, loading, projects } = await useUser();
  const project = computed(() => params ? getProjectFromParams(params) : undefined);

  const getProjectById = (
    projectId: number | string | undefined | null | string[],
  ): FullProject | undefined => {
    projectId = requireNumber(projectId, 'projectId')

    const result = projects.value.find(p => p.id === projectId);
    return result;
  }

  const createProject = async (
    name: string, fields: NewProjectField[]
  ): Promise<FullProject> => {
    return $fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, fields }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async (response) => {
      await refreshUser();
      return response;
    })
  };

  const patchProject = async (
    projectId: number,
    patch: { name?: string, ownerCanDelockObservations: boolean, authorCanDelockObservations: boolean }
  ): Promise<Response> => {
    return fetch(
      `/api/projects/${projectId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).then(async (res) => {
      await refreshUser();
      return res;
    })
  };

  const addCollaborator = async (
    projectId: number,
    email: string,
  ): Promise<any> => {
    return fetch(
      `/api/projects/${projectId}/collaborators`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  };

  const removeCollaborator = async (
    projectId: number,
    collaboratorId: number,
  ): Promise<any> => {
    return fetch(
      `/api/projects/${projectId}/collaborators/${collaboratorId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  };

  const patchCollaborator = async (
    projectId: number,
    collaboratorId: number,
    patch: { nameInProject: string, role?: string }
  ): Promise<Response> => {
    return fetch(
      `/api/projects/${projectId}/collaborators/${collaboratorId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  };


  const duplicateProject = async (
    name: string,
    projectId: number,
  ): Promise<any> => {
    return fetch(
      `/api/projects/${projectId}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  };

  const sortFields = (project: FullProject) => [...project.fields].sort(
    (a, b) => a.index > b.index ? 1 : -1
  );

  const hasOwnership = (
    projectId: number | string,
    projects: FullProject[]
  ): boolean => {
    projectId = requireNumber(projectId, 'projectId')
    if (!projects.length) {
      return false;
    }
    const ownedIds = projects.map(p => p.id);
    const ownsProject = !!ownedIds.find(id => id === projectId);
    return ownsProject;
  }

  const getProjectFromParams = (params: RouteParams): FullProject | undefined => {
    try {
      const p = getProjectById(params?.projectId);
      return p;
    } catch {
      return undefined;
    }
  }

  const deleteParameter = async (projectId: number, field: { id: number }) => {
    return fetch(
      `/api/projects/${projectId}/fields/${field.id}`,
      {
        method: 'DELETE',
      }
    )
  }

  const createParameter = async (
    projectId: number,
    field: NewProjectField
  ) => {
    return fetch(
      `/api/projects/${projectId}/fields`,
      {
        method: 'POST',
        body: JSON.stringify(field),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  const updateParameter = async (
    projectId: number,
    fieldId: number,
    field: Partial<NewProjectField>
  ) => {
    return fetch(
      `/api/projects/${projectId}/fields/${fieldId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(field),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  const moveParameter = async (
    projectId: number,
    fieldId: number,
    moveUp: boolean,
  ) => {
    return fetch(
      `/api/projects/${projectId}/fields/${fieldId}/move`,
      {
        method: 'PATCH',
        body: JSON.stringify({ up: moveUp }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  const isOwner = computed(() =>
    project.value?.id && hasRoles(project.value.id, ['OWNER']),
  );


  return {
    addCollaborator,
    createParameter,
    createProject,
    deleteParameter,
    duplicateProject,
    getProjectById,
    hasOwnership,
    isOwner,
    loading,
    patchCollaborator,
    patchProject,
    project,
    projects,
    removeCollaborator,
    sortFields,
    updateParameter,
    moveParameter,
  };
};